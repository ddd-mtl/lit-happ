import {DnaProxy} from "./DnaProxy";
import {IZomeViewModel} from "./ZomeViewModel";
import {ReactiveElement} from "lit";
import {AgentPubKeyB64, Dictionary, DnaHashB64} from "@holochain-open-dev/core-types";
import { ViewModel } from "./ViewModel";
import { AgentPubKey } from "@holochain/client";


/** Interface for the generic-less DnaViewModel class */
export interface IDnaViewModel {
  get entryTypes(): Dictionary<[string, boolean][]>;
  get roleId(): string;
  get dnaHash(): DnaHashB64;
  get agentPubKey(): AgentPubKeyB64;
  probeAll(): Promise<void>;
  dumpLogs(zomeName?: string): void;
}


/**
 * Abstract ViewModel for a DNA.
 * It holds the DnaClient and all the ZomeViewModels of the DNA.
 * It is bound to one host ReactiveElement.
 * A DNA is expected to derive this class and add extra logic at the DNA level.
 */
export abstract class DnaViewModel<P> extends ViewModel<P> implements IDnaViewModel {

  /** Ctor */
  protected constructor(protected _dnaProxy: DnaProxy) {super()}

  // abstract provideContext(host: ReactiveElement):  Promise<void>;    
  // abstract getContext(): any; // FIXME: use context type
  // abstract get perspective(): P;


  /** -- Fields -- */

  private _allEntryTypes: Dictionary<[string, boolean][]> = {};
  protected _zomeViewModels: Dictionary<IZomeViewModel> = {};


  /** -- Getters -- */

  get entryTypes(): Dictionary<[string, boolean][]>  {return this._allEntryTypes}
  get roleId(): string { return this._dnaProxy.roleId }
  get dnaHash(): DnaHashB64 { return this._dnaProxy.dnaHash }
  get agentPubKey(): AgentPubKeyB64 {return this._dnaProxy.agentPubKey}


  /** -- Methods -- */

  /** */
  getZomeViewModel(name: string): IZomeViewModel | undefined {
    return this._zomeViewModels[name]
  }

  /** */
  protected async addZomeViewModel(zvmClass: {new(dnaProxy: DnaProxy): IZomeViewModel}) {
    const zvm = new zvmClass(this._dnaProxy);
    //vm.provideContext(this.host);
    this._allEntryTypes[zvm.zomeName] = await zvm.getEntryDefs();
    this._zomeViewModels[zvm.zomeName] = zvm;
  }

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
