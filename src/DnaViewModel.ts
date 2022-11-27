import {CellProxy} from "./CellProxy";
import {ZomeViewModel} from "./ZomeViewModel";
import {ReactiveElement} from "lit";
import {AgentPubKeyB64, Dictionary, EntryHashB64} from "@holochain-open-dev/core-types";
import {ViewModel} from "./ViewModel";
import {CellId, InstalledAppId, InstalledCell, RoleId, ZomeName} from "@holochain/client";
import {ICellDef, ZvmDef} from "./definitions";
import {createContext} from "@lit-labs/context";
import {RoleSpecific, RoleSpecificMixin } from "./mixins";
import { ConductorAppProxy } from "./ConductorAppProxy";


//export type IDnaViewModel = _DnaViewModel & ICellDef & typeof RoleSpecific;

/** Interface specific to DnaViewModel class */
interface IDnaViewModel {
  fetchAllEntryDefs(): Promise<Dictionary<[string, boolean][]>>;
  //get entryTypes(): Dictionary<[string, boolean][]>;
  dumpLogs(zomeName?: ZomeName): void;
}

export type DvmConstructor = {
  new(
    host: ReactiveElement, 
    installedAppId: InstalledAppId, 
    conductorAppProxy: ConductorAppProxy, 
    roleId?: RoleId,
    ): DnaViewModel;
  } & typeof RoleSpecific;


/**
 * Abstract ViewModel for a DNA.
 * It holds the CellProxy and all the ZomeViewModels of the DNA.
 * A DNA is expected to derive this class and add extra logic at the DNA level.
 */
export abstract class DnaViewModel extends RoleSpecificMixin(ViewModel) implements ICellDef, IDnaViewModel {

  /* private */ static ZVM_DEFS: ZvmDef[];

  /** Ctor */
  constructor(   
    host: ReactiveElement, 
    installedAppId: InstalledAppId, 
    conductorAppProxy: ConductorAppProxy,     
    roleId?: RoleId,
    ) {
    super();
    if (roleId) {
      this.roleId = roleId;
    }
    const zvmDefs = (this.constructor as any).ZVM_DEFS;
    this._cellProxy = conductorAppProxy.getCellProxy(installedAppId, this.roleId); // WARN can throw error
    /** Create all ZVMs for this DNA */
    for (const zvmDef of zvmDefs) {
      let zvm;
      if (Array.isArray(zvmDef)) {
        zvm = new zvmDef[0](this._cellProxy, zvmDef[1]);
      } else {
        zvm = new zvmDef(this._cellProxy);
      }
      // TODO check zvm.zomeName exists in _cellProxy
      this._zomeViewModels[zvm.zomeName] = zvm;
    }
    this.provideContext(host);
  }


  /** -- Fields -- */
  protected _cellProxy: CellProxy;
  protected _zomeViewModels: Dictionary<ZomeViewModel> = {};
  private _allEntryDefs: Dictionary<[string, boolean][]> = {};


  /** CellDef interface */
  get installedCell(): InstalledCell {return this._cellProxy.installedCell}
  //get roleId(): RoleId { return this._cellProxy.roleId } // Already defined in RoleSpecificMixin
  get cellId(): CellId { return this._cellProxy.cellId }
  get dnaHash(): EntryHashB64 { return this._cellProxy.dnaHash}
  get agentPubKey(): AgentPubKeyB64 { return this._cellProxy.agentPubKey }


  /** -- Getters -- */

  getEntryDefs(zomeName: ZomeName): [string, boolean][] | undefined {return this._allEntryDefs[zomeName]}
  getZomeViewModel(zomeName: ZomeName): ZomeViewModel | undefined {return this._zomeViewModels[zomeName]}


  /** -- Methods -- */

  /** Override so we can provide context of all zvms */
  /*private*/ provideContext(host: ReactiveElement): void {
    //console.log("DVM.provideContext()", host, this)
    super.provideContext(host);
    for (const zvm of Object.values(this._zomeViewModels)) {
      zvm.provideContext(host)
    }
  }


  getContext():any {return createContext<typeof this>('dvm/' + this.roleId)};


  /** */
  async probeAll(): Promise<void> {
    for (const [name, zvm] of Object.entries(this._zomeViewModels)) {
      //console.log("Dvm.probeAll()", name)
      await zvm.probeAll();
    }
  }


  /** Useless since the entry defs are in the integrity zome which is not represented here */
  async fetchAllEntryDefs(): Promise< Dictionary<[string, boolean][]>> {
    for (const zvm of Object.values(this._zomeViewModels)) {
      const zomeName =  zvm.zomeName;
      this._allEntryDefs[zomeName] = await this._cellProxy.callEntryDefs(zomeName); // TODO optimize
    }
    return this._allEntryDefs;
  }



  /** */
  dumpLogs(zomeName?: ZomeName): void {
    this._cellProxy.dumpLogs(zomeName)
  }
}
