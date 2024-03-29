import {ZomeViewModel} from "./ZomeViewModel";
import {ReactiveElement} from "lit";
import {ViewModel} from "./ViewModel";
import {
  AdminWebsocket,
  GrantedFunctionsType,
  InstalledAppId,
  ZomeName,
} from "@holochain/client";
import {DnaModifiersOptions, ZvmDef} from "./definitions";
import {Context, createContext} from "@lit/context";
import {
  CellProxy,
  AppProxy,
  HCL,
  Dictionary, CellMixin
} from "@ddd-qc/cell-proxy";
import {RoleMixin, RoleSpecific} from "./roleMixin";


//export type IDnaViewModel = _DnaViewModel & ICellDef & typeof RoleSpecific;

/** Interface specific to DnaViewModel class */
interface IDnaViewModel {
  dumpLogs(zomeName?: ZomeName): void;
  /** zomeName -> (AppEntryName, isPublic)[]*/
  fetchAllEntryDefs(): Promise<Dictionary<[string, boolean][]>>;
  //get entryTypes(): Dictionary<[string, boolean][]>;
  //getZomeEntryDefs(zomeName: ZomeName): [string, boolean][] | undefined;
  //getZomeViewModel(zomeName: ZomeName): ZomeViewModel | undefined
}

export type DvmConstructor = typeof RoleSpecific & {DNA_MODIFIERS: DnaModifiersOptions} & {
  new(host: ReactiveElement, proxy: AppProxy, idOrHcl: HCL | InstalledAppId): DnaViewModel;
};


/**
 * Abstract ViewModel for a DNA.
 * It holds the CellProxy and all the ZomeViewModels of the DNA.
 * It is expected to derive this class for each DNA and add extra logic at the DNA level.
 * TODO: Split into RoleViewModel and CellViewModel (e.g. have call logs separated by role)
 */
export abstract class DnaViewModel extends CellMixin(RoleMixin(ViewModel)) implements IDnaViewModel {

  /* private */ static ZVM_DEFS: ZvmDef[];
  static DNA_MODIFIERS: DnaModifiersOptions;


  /** Ctor */
  constructor(public readonly host: ReactiveElement, appProxy: AppProxy, idOrHcl: HCL | InstalledAppId) {
    super();
    if (typeof idOrHcl === 'object') {
      this.baseRoleName = idOrHcl.baseRoleName;
      this.hcl = idOrHcl;
    } else {
      this.hcl = new HCL(idOrHcl, this.baseRoleName);
    }
    const dvmCtor = (this.constructor as typeof DnaViewModel)
    const zvmDefs = dvmCtor.ZVM_DEFS;
    this._cellProxy = appProxy.getCellProxy(this.hcl); // WARN can throw error
    this._cell = this._cellProxy.cell;
    console.log(`DVM.ctor of ${this.baseRoleName}`, this._cellProxy.cell);
    /** Create all ZVMs for this DNA */
    for (const zvmDef of zvmDefs) {
      let zvm;
      if (Array.isArray(zvmDef)) {
        zvm = new zvmDef[0](this._cellProxy, this, zvmDef[1]);
      } else {
        zvm = new zvmDef(this._cellProxy, this);
      }
      // TODO check zvm.zomeName exists in _cellProxy
      this._zomeViewModels[zvm.zomeName] = zvm;
      this._zomeNames[zvmDef.constructor.name] = zvm.zomeName;
    }
    this.provideContext(host); // TODO move this to host.connectedCallback? e.g. change ViewModel to a ReactiveController
  }


  /** -- Fields -- */

  protected _cellProxy: CellProxy;
  /* ZomeName -> Zvm */
  protected _zomeViewModels: Dictionary<ZomeViewModel> = {};
  /* ZvmCtorName -> ZomeName */
  protected _zomeNames: Dictionary<ZomeName> = {};
  /* ZomeName -> [EntryName, EntryVisibility] */
  private _allEntryDefs: Dictionary<[string, boolean][]> = {};

  public readonly hcl: HCL;


  /** -- Getters -- */

  getZomeEntryDefs(zomeName: ZomeName): [string, boolean][] | undefined {return this._allEntryDefs[zomeName]}
  getZomeViewModel(zomeName: ZomeName): ZomeViewModel | undefined {return this._zomeViewModels[zomeName]}
  getZomeName(zvm: typeof ZomeViewModel): ZomeName | undefined { return this._zomeNames[zvm.constructor.name]}

  /** -- Methods -- */

  /** Override so we can provide context of all zvms */
  /*private*/ provideContext(host: ReactiveElement): void {
    //console.log("DVM.provideContext()", host, this)
    super.provideContext(host);
    for (const zvm of Object.values(this._zomeViewModels)) {
      zvm.provideContext(host)
    }
  }


  getContext(): Context<unknown, unknown> {return createContext<typeof this>('dvm/' + this.cell.name)};


  /** */
  async authorizeZomeCalls(adminWs: AdminWebsocket): Promise<void> {
    let allFnNames = [];
    for (const [_zomeName, zvm] of Object.entries(this._zomeViewModels)) {
      allFnNames = allFnNames.concat(zvm.zomeProxy.fnNames)
    }
    const grantedFns = { [GrantedFunctionsType.Listed]: allFnNames }
    try {
        console.log("authorizeSigningCredentials: " + this.cell.hcl().toString(), allFnNames);
        console.log("authorizeSigningCredentials. cell_id = [" + this.cell.dnaHash + " ; " + this.cell.agentPubKey + "]");
        //await adminWs.authorizeSigningCredentials(this.cell.id, grantedFns);
        await adminWs.authorizeSigningCredentials(this.cell.id);
    } catch(e) {
      console.warn("authorizeSigningCredentials FAILED.", e);
    }
   // this._signingProps = getSigningCredentials(this.cellId);
   //  console.log({signProps: this._signingProps})
   //
   //  for (const [zomeName, zvm] of Object.entries(this._zomeViewModels)) {
   //    zvm.zomeProxy.setSigningProps(this._signingProps);
   //  }
  }


  /** Not async on purpose as we except this to be long. Post-processing should be done via Observer pattern */
  protected probeAllInner(): void {
    for (const [_name, zvm] of Object.entries(this._zomeViewModels)) {
      //console.log("Dvm.probeAll()", name)
      zvm.probeAll();
    }
  }


  /** */
  zvmChanged(zvm: ZomeViewModel): void {}


  /** */
  async initializePerspectiveOffline(): Promise<void> {
    const all = [];
    for (const [_name, zvm] of Object.entries(this._zomeViewModels)) {
      const p = zvm.initializePerspectiveOffline();
      all.push(p);
    }
    await Promise.all(all);
  }


  /** */
  async initializePerspectiveOnline(): Promise<void> {
    const all = [];
    for (const [_name, zvm] of Object.entries(this._zomeViewModels)) {
      const p = zvm.initializePerspectiveOnline();
      all.push(p);
    }
    await Promise.all(all);
  }


  /** Maybe useless since the entry defs are in the integrity zome which is not represented here */
  async fetchAllEntryDefs(): Promise<Dictionary<[string, boolean][]>> {
    for (const zvm of Object.values(this._zomeViewModels)) {
      const zomeName = zvm.zomeName;
      try {
        const defs = await this._cellProxy.callEntryDefs(zomeName); // TODO optimize
        this._allEntryDefs[zomeName] = defs
      } catch (e) {
        console.warn(`Calling "entry_defs()" failed on zome "${zomeName}". Possibly because zome does not have any entry types defined.`)
        this._allEntryDefs[zomeName] = [];
      }
    }
    return this._allEntryDefs;
  }



  /** */
  dumpLogs(zomeName?: ZomeName): void {
    this._cellProxy.dumpLogs(zomeName);
    this._cellProxy.dumpSignals();
  }
}
