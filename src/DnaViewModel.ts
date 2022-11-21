import {CellProxy} from "./CellProxy";
import {IZomeViewModel, ZvmClass} from "./ZomeViewModel";
import {ReactiveElement} from "lit";
import {AgentPubKeyB64, Dictionary, DnaHashB64} from "@holochain-open-dev/core-types";
import { ViewModel } from "./ViewModel";
import { HappViewModel } from "./HappViewModel";
import {InstalledCell, RoleId} from "@holochain/client";


export type DvmClass = {new(happ: HappViewModel, roleId: string): IDnaViewModel}


/** Interface for the generic-less DnaViewModel class */
export interface IDnaViewModel {
  fetchAllEntryDefs(): Promise<Dictionary<[string, boolean][]>>;
  //get entryTypes(): Dictionary<[string, boolean][]>;
  get roleId(): string;
  get dnaHash(): DnaHashB64;
  get agentPubKey(): AgentPubKeyB64;
  get cellData(): InstalledCell;
  probeAll(): Promise<void>;
  dumpLogs(zomeName?: string): void;
  provideContext(host: ReactiveElement): void;
}


/**
 * Abstract ViewModel for a DNA.
 * It holds the DnaProxy and all the ZomeViewModels of the DNA.
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

  private _allEntryDefs: Dictionary<[string, boolean][]> = {};
  protected _zomeViewModels: Dictionary<IZomeViewModel> = {};
  protected _cellProxy: CellProxy;

  /** -- Getters -- */

  //get entryTypes(): Dictionary<[string, boolean][]> {return this._allEntryTypes}
  get roleId(): string {return this._cellProxy.roleId}
  get dnaHash(): DnaHashB64 {return this._cellProxy.dnaHash}
  get agentPubKey(): AgentPubKeyB64 {return this._cellProxy.agentPubKey}
  get cellData(): InstalledCell {return this._cellProxy.cellData}

  getZomeViewModel(name: string): IZomeViewModel | undefined {
    return this._zomeViewModels[name]
  }


  /** -- Methods -- */

  /** Override so we can provide context of all zomes */
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


  /** */
  async fetchAllEntryDefs(): Promise< Dictionary<[string, boolean][]>> {
    for (const zvm of Object.values(this._zomeViewModels)) {
      this._allEntryDefs[zvm.zomeName] = await zvm.fetchEntryDefs(); // TODO optimize
    }
    return this._allEntryDefs;
  }



  /** */
  dumpLogs(zomeName?: string): void {
    this._cellProxy.dumpLogs(zomeName)
  }
}
