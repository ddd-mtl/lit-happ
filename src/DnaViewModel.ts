import {DnaProxy} from "./DnaProxy";
import {IZomeViewModel, ZvmClass} from "./ZomeViewModel";
import {ReactiveElement} from "lit";
import {AgentPubKeyB64, Dictionary, DnaHashB64} from "@holochain-open-dev/core-types";
import { ViewModel } from "./ViewModel";


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
  protected constructor(protected _dnaProxy: DnaProxy, zvmClasses: ZvmClass[]) {
    super();
    for (const zvm of zvmClasses) {
      const obj = new zvm(this._dnaProxy);
      this._zomeViewModels[obj.zomeName] = obj;
    }
  }


  /** -- Fields -- */

  private _allEntryDefs: Dictionary<[string, boolean][]> = {};
  protected _zomeViewModels: Dictionary<IZomeViewModel> = {};


  /** -- Getters -- */

  //get entryTypes(): Dictionary<[string, boolean][]> {return this._allEntryTypes}
  get roleId(): string {return this._dnaProxy.roleId}
  get dnaHash(): DnaHashB64 {return this._dnaProxy.dnaHash}
  get agentPubKey(): AgentPubKeyB64 {return this._dnaProxy.agentPubKey}

  getZomeViewModel(name: string): IZomeViewModel | undefined {
    return this._zomeViewModels[name]
  }


  /** -- Methods -- */

  provideContext(host: ReactiveElement): void {
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


  // /** */
  // protected addZomeViewModel(zvmClass: ZvmClass): void {
  //   const zvm = new zvmClass(this._dnaProxy);
  //   //vm.provideContext(this.host);
  //   //this._allEntryTypes[zvm.zomeName] = await zvm.getEntryDefs();
  //   this._zomeViewModels[zvm.zomeName] = zvm;
  // }

  /** */
  async probeAll(): Promise<void> {
    for (const [_name, zvm] of Object.entries(this._zomeViewModels)) {
      await zvm.probeAll();
    }
  }

  /** */
  dumpLogs(zomeName?: string): void {
    this._dnaProxy.dumpLogs(zomeName)
  }
}
