import {CellProxy} from "./CellProxy";
import {IZomeViewModel, ZvmClass} from "./ZomeViewModel";
import {ReactiveElement} from "lit";
import {AgentPubKeyB64, Dictionary, DnaHashB64} from "@holochain-open-dev/core-types";
import { ViewModel } from "./ViewModel";
import { HappViewModel } from "./HappViewModel";


export type DvmClass = {new(happ: HappViewModel, roleId: string): IDnaViewModel}


/** Interface for the generic-less DnaViewModel class */
export interface IDnaViewModel {
  fetchAllEntryDefs(): Promise<Dictionary<[string, boolean][]>>;
  //get entryTypes(): Dictionary<[string, boolean][]>;
  get roleId(): string;
  get dnaHash(): DnaHashB64;
  get agentPubKey(): AgentPubKeyB64;
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
  protected constructor(happ: HappViewModel, protected _cellProxy: CellProxy, zvmClasses: ZvmClass[]) {
    super();
    //happ.addDvm(this);
    this.provideContext(happ.host);
    /** Create all ZVMs for this DNA */
    for (const zvmClass of zvmClasses) {
      const zvm = new zvmClass(this._cellProxy);
      this._zomeViewModels[zvm.zomeName] = zvm;
    }
  }


  /** -- Fields -- */

  private _allEntryDefs: Dictionary<[string, boolean][]> = {};
  protected _zomeViewModels: Dictionary<IZomeViewModel> = {};


  /** -- Getters -- */

  //get entryTypes(): Dictionary<[string, boolean][]> {return this._allEntryTypes}
  get roleId(): string {return this._cellProxy.roleId}
  get dnaHash(): DnaHashB64 {return this._cellProxy.dnaHash}
  get agentPubKey(): AgentPubKeyB64 {return this._cellProxy.agentPubKey}

  getZomeViewModel(name: string): IZomeViewModel | undefined {
    return this._zomeViewModels[name]
  }


  /** -- Methods -- */

  /** Override so we can provide context of all zomes */
  /*private*/ provideContext(host: ReactiveElement): void {
    super.provideContext(host);
    for (const zvm of Object.values(this._zomeViewModels)) {
      zvm.provideContext(host)
    }
  }

  async fetchAllEntryDefs(): Promise< Dictionary<[string, boolean][]>> {
    for (const zvm of Object.values(this._zomeViewModels)) {
      this._allEntryDefs[zvm.zomeName] = await zvm.fetchEntryDefs(); // TODO optimize
    }
    return this._allEntryDefs;
  }


  /** */
  async probeAll(): Promise<void> {
    for (const [_name, zvm] of Object.entries(this._zomeViewModels)) {
      await zvm.probeAll();
    }
  }

  /** */
  dumpLogs(zomeName?: string): void {
    this._cellProxy.dumpLogs(zomeName)
  }
}
