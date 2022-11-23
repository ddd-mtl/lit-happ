import {CellProxy} from "./CellProxy";
import {IZomeViewModel, ZvmClass} from "./ZomeViewModel";
import {ReactiveElement} from "lit";
import {AgentPubKeyB64, Dictionary, DnaHashB64, EntryHashB64} from "@holochain-open-dev/core-types";
import { ViewModel } from "./ViewModel";
import { HappViewModel } from "./HappViewModel";
import {CellId, InstalledCell, RoleId} from "@holochain/client";
import {CellDef} from "./CellDef";


export type DvmClass = {new(happ: HappViewModel, roleId: string): IDnaViewModel}


export type IDnaViewModel = _DnaViewModel & CellDef

/** Interface for the generic-less DnaViewModel class */
interface _DnaViewModel {
  fetchAllEntryDefs(): Promise<Dictionary<[string, boolean][]>>;
  //get entryTypes(): Dictionary<[string, boolean][]>;

  // get roleId(): RoleId;
  // get dnaHash(): DnaHashB64;
  // get agentPubKey(): AgentPubKeyB64;
  //get cellDef(): InstalledCell;

  probeAll(): Promise<void>;
  dumpLogs(zomeName?: string): void;
  provideContext(host: ReactiveElement): void;
}


/**
 * Abstract ViewModel for a DNA.
 * It holds the CellProxy and all the ZomeViewModels of the DNA.
 * A DNA is expected to derive this class and add extra logic at the DNA level.
 */
export abstract class DnaViewModel<P> extends ViewModel<P> implements IDnaViewModel {

  /** Ctor */
  protected constructor(happ: HappViewModel, roleId: RoleId, zvmClasses: ZvmClass[]) {
    super();
    this._cellProxy = happ.conductorAppProxy.newCellProxy(happ.appInfo, roleId); // FIXME can throw error
    /** Create all ZVMs for this DNA */
    for (const zvmClass of zvmClasses) {
      const zvm = new zvmClass(this._cellProxy);
      this._zomeViewModels[zvm.zomeName] = zvm;
    }
    this.provideContext(happ.host);
  }


  /** -- Fields -- */
  protected _cellProxy: CellProxy;
  protected _zomeViewModels: Dictionary<IZomeViewModel> = {};
  private _allEntryDefs: Dictionary<[string, boolean][]> = {};


  /** CellDef interface */
  get cellDef(): InstalledCell {return this._cellProxy.cellDef}
  get roleId(): RoleId { return this._cellProxy.roleId }
  get cellId(): CellId { return this._cellProxy.cellId }
  get dnaHash(): EntryHashB64 { return this._cellProxy.dnaHash}
  get agentPubKey(): AgentPubKeyB64 { return this._cellProxy.agentPubKey }


  /** -- Getters -- */

  getEntryDefs(zomeName: string): [string, boolean][] | undefined {return this._allEntryDefs[zomeName]}
  getZomeViewModel(zomeName: string): IZomeViewModel | undefined {return this._zomeViewModels[zomeName]}


  /** -- Methods -- */

  /** Override so we can provide context of all zvms */
  /*private*/ provideContext(host: ReactiveElement): void {
    //console.log("DVM.provideContext()", host, this)
    super.provideContext(host);
    for (const zvm of Object.values(this._zomeViewModels)) {
      zvm.provideContext(host)
    }
  }


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
      this._allEntryDefs[zvm.zomeName] = await this._cellProxy.callEntryDefs(zvm.zomeName); // TODO optimize
    }
    return this._allEntryDefs;
  }



  /** */
  dumpLogs(zomeName?: string): void {
    this._cellProxy.dumpLogs(zomeName)
  }
}
