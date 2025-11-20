import {ZomeViewModel} from "./ZomeViewModel";
import {ReactiveElement} from "lit";
import {ViewModel} from "./ViewModel";
import {
  AdminWebsocket, FunctionName,
  InstalledAppId,
  ZomeName,
} from "@holochain/client";
import {DnaModifiersOptions, ZvmDef} from "./definitions";
import {Context, createContext} from "@lit/context";
import {
  CellProxy,
  AppProxy,
  HCL,
  MyDictionary, CellMixin, AgentId, EntryDef, ZomeInfo, DnaInfo
} from "@ddd-qc/cell-proxy";
import {RoleMixin, RoleSpecific} from "./roleMixin";
import {GetStrategy} from "@holochain-open-dev/core-types";


//export type IDnaViewModel = _DnaViewModel & ICellDef & typeof RoleSpecific;

/** Interface specific to DnaViewModel class */
interface IDnaViewModel {
  dumpCallLogs(zomeName?: ZomeName): void;
  dumpSignalLogs(zomeName?: ZomeName): void;
  /** zomeName -> (AppEntryName, isPublic)[] */
  //fetchAllEntryDefs(): Promise<void>;
  //get entryTypes(): Dictionary<[string, boolean][]>;
  //getZomeEntryDefs(zomeName: ZomeName): [string, boolean][] | undefined;
  //getZomeViewModel(zomeName: ZomeName): ZomeViewModel | undefined
}

export type DvmConstructor = typeof RoleSpecific & {DNA_MODIFIERS: DnaModifiersOptions} & {
  new(host: ReactiveElement, proxy: AppProxy, idOrHcl: HCL | InstalledAppId, isMainView: boolean): DnaViewModel;
};


/**
 * Abstract ViewModel for a DNA.
 * It holds the CellProxy and all the ZomeViewModels of the DNA.
 * It is expected to derive this class for each DNA and add extra logic at the DNA level.
 * TODO: Split into RoleViewModel and CellViewModel (e.g. have call logs separated by role)
 */
export abstract class DnaViewModel extends CellMixin(RoleMixin(ViewModel)) implements IDnaViewModel {
  /** -- Static -- */
  /* private */ static ZVM_DEFS: ZvmDef[];
  static DNA_MODIFIERS: DnaModifiersOptions;

  /** -- Fields -- */
  protected _cellProxy: CellProxy;
  /* ZomeName -> Zvm */
  protected _zomeViewModels: MyDictionary<ZomeViewModel> = {};
  /* ZvmCtorName -> ZomeName */
  protected _zomeNames: ZomeName[] = [];
  /* ZomeName -> (EntryName -> EntryDef) */
  private _allEntryDefs: MyDictionary<MyDictionary<EntryDef>> = {};
  /* ZomeName -> ZomeInfo */
  private _allZomeInfo: MyDictionary<ZomeInfo> = {};
  private _dnaInfo: DnaInfo | undefined = undefined;

  /** list of "known" peers in this DNA */
  protected _livePeers: AgentId[] = [];

  public readonly hcl: HCL;


  /** Ctor */
  constructor(public readonly host: ReactiveElement, appProxy: AppProxy, idOrHcl: HCL | InstalledAppId, isMainView: boolean) {
    super(isMainView);
    if (typeof idOrHcl === 'object') {
      this.baseRoleName = idOrHcl.baseRoleName;
      this.hcl = idOrHcl;
    } else {
      this.hcl = new HCL(idOrHcl, this.baseRoleName);
    }
    const dvmCtor = (this.constructor as typeof DnaViewModel)
    const zvmDefs = dvmCtor.ZVM_DEFS;
    if (zvmDefs.length == 0) {
      throw Error(`DNA ${this.baseRoleName} does not have any zomes`);
    }
    this._cellProxy = appProxy.getCellProxy(this.hcl); // WARN can throw error
    this._cell = this._cellProxy.cell;
    console.log(`DVM.ctor of ${this.baseRoleName}`, this._cellProxy.cell);
    /** Create all ZVMs for this DNA */
    for (const zvmDef of zvmDefs) {
      let zvm: ZomeViewModel;
      if (Array.isArray(zvmDef)) {
        zvm = new zvmDef[0](this._cellProxy, this, isMainView, zvmDef[1]);
      } else {
        zvm = new zvmDef(this._cellProxy, this, isMainView);
      }
      // TODO check zvm.zomeName exists in _cellProxy
      this._zomeViewModels[zvm.zomeName] = zvm;
      this._zomeNames.push(zvm.zomeName);
    }
    this.provideContext(host); // TODO move this to host.connectedCallback? e.g. change ViewModel to a ReactiveController
  }


  /** -- Getters -- */

  get allEntryDefs(): MyDictionary<MyDictionary<EntryDef>> { return this._allEntryDefs }

  get allZomeInfo(): MyDictionary<ZomeInfo> { return this._allZomeInfo }

  get dnaInfo(): DnaInfo { return this._dnaInfo! }

  get livePeers(): AgentId[] { return this._livePeers };

  get zomeNames(): ZomeName[] {return Object.values(this._zomeNames);}

  getZomeEntryDefs(zomeName: ZomeName): MyDictionary<EntryDef> {
    const maybe = this._allEntryDefs[zomeName];
    if (!maybe) {
      throw Error("Unknown zome in DVM: " + zomeName + ". Available zomes: " + this.zomeNames.join(', '));
    }
    return maybe;
  }

  getZomeViewModel(zomeName: ZomeName): ZomeViewModel {
    const maybe = this._zomeViewModels[zomeName];
    if (!maybe) {
      throw Error("Unknown zome in DVM: " + zomeName + ". Available zomes: " + this.zomeNames.join(', '));
    }
    return maybe;
  }

  // getZomeName(zvm: typeof ZomeViewModel): ZomeName {
  //   console.log("getZomeName()", zvm.constructor.name);
  //   const maybe = this._zomeViewModels[zvm.constructor.name];
  //   if (!maybe) {
  //     throw Error("Unknown zome in DVM: " + zvm.DEFAULT_ZOME_NAME + ". Available zomes: " + this.zomeNames.join(', '));
  //   }
  //   return maybe;
  // }

  /** -- Methods -- */

  /** Override so we can provide context of all zvms */
  /*private*/ override provideContext(host: ReactiveElement): void {
    //console.log("DVM.provideContext()", host, this)
    super.provideContext(host);
    for (const zvm of Object.values(this._zomeViewModels)) {
      zvm.provideContext(host)
    }
  }


  getContext(): Context<unknown, unknown> {return createContext<typeof this>('dvm/' + this.cell.name + "/" + this.cell.address.dnaId.b64)};


  /** */
  async authorizeZomeCalls(adminWs: AdminWebsocket): Promise<void> {
    let allFnNames: [ZomeName, FunctionName][] = [];
    for (const [_zomeName, zvm] of Object.entries(this._zomeViewModels)) {
      allFnNames = allFnNames.concat(zvm.zomeProxy.fnNames)
    }
    //const grantedFns = { [GrantedFunctionsType.Listed]: allFnNames }
    try {
        console.log("authorizeSigningCredentials: " + this.cell.hcl().toString(), allFnNames);
        console.log("authorizeSigningCredentials. cell_id = " + this.cell.address.str);
        //await adminWs.authorizeSigningCredentials(this.cell.id, grantedFns);
        await adminWs.authorizeSigningCredentials(this.cell.address.intoId());
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


  /** Not async on purpose as we except this to be long. Post-processing should be done via an observer pattern. */
  protected override probeAllInner(strategy: GetStrategy): void {
    for (const [_name, zvm] of Object.entries(this._zomeViewModels)) {
      //console.log("Dvm.probeAll()", name)
      zvm.probeAll(strategy);
    }
  }


  /** */
  zvmChanged(_zvm: ZomeViewModel): void {}


  /** */
  override async initializePerspectiveFromLocal(): Promise<void> {
    await this.queryAllDnaData();
    const all = [];
    for (const [_name, zvm] of Object.entries(this._zomeViewModels)) {
      const p = zvm.initializePerspectiveFromLocal();
      all.push(p);
    }
    await Promise.all(all);
  }


  /** */
  override async initializePerspectiveFromNetwork(): Promise<void> {
    const all = [];
    for (const [_name, zvm] of Object.entries(this._zomeViewModels)) {
      const p = zvm.initializePerspectiveFromNetwork();
      all.push(p);
    }
    await Promise.all(all);
  }


  /** */
  private async queryAllDnaData(): Promise<void> {
    /** DnaInfo */
    const dnaInfo = await this._cellProxy.callDnaInfo(this.zomeNames[0]!);
    this._dnaInfo = dnaInfo;
    // /** ZomeInfo from dnaInfo */
    // for (const zomeName of dnaInfo.zome_names) {
    //   this._allZomeInfo[zomeName] = await this._cellProxy.callZomeInfo(zomeName);
    // }
    /** ZomeInfo from known Zomes */
    for (const zomeName of this.zomeNames) {
      this._allZomeInfo[zomeName] = await this._cellProxy.callZomeInfo(zomeName);
    }
    /** EntryDefs */
    for (const zomeName of Object.keys(this._allZomeInfo)) {
        try {
          this._allEntryDefs[zomeName] = await this._cellProxy.callEntryDefs(zomeName);
        } catch(e: any) {
          if (e.throttled) {
            continue;
          }
          return Promise.reject(e);
        }
    }
  }


  /** */
  dumpCallLogs(zomeName?: ZomeName): void {
    this._cellProxy.dumpCallLogs(zomeName);
  }


  /** */
  dumpSignalLogs(zomeName?: ZomeName): void {
    console.warn("Dumping signals in DVM", this.baseRoleName);
    if (zomeName == undefined) {
      for (const [name, zvm] of Object.entries(this._zomeViewModels)) {
        const logs = this._cellProxy.signalLogs.filter((log) => log.zomeName == name)
        zvm.dumpSignalLogs(logs);
      }
      return;
    }
    if (this._zomeViewModels[zomeName]) {
      const logs = this._cellProxy.signalLogs.filter((log) => log.zomeName == zomeName)
      this._zomeViewModels[zomeName]!.dumpSignalLogs(logs);
    } else {
      console.error(`Unknown zome ${zomeName} in DVM ${this.baseRoleName}`)
    }
  }

  /** */
  purgeLogs() {
    this._cellProxy.purgeLogs();
  }
}
