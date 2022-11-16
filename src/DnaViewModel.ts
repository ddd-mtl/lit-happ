import {DnaClient} from "./DnaClient";
import {IZomeViewModel} from "./ZomeViewModel";
import {ReactiveElement} from "lit";
import {Dictionary} from "@holochain-open-dev/core-types";


/**
 * ABC for holding the DnaClient and all the ZomeViewModels of the DNA by a host ReactiveElement.
 * A DNA is expected to derive this class and add extra logic at the DNA level.
 */
export class DnaViewModel {
  /** async Factory */
  static async new(host: ReactiveElement, port: number, installedAppId: string): Promise<DnaViewModel> {
    let dnaClient = await DnaClient.new(port, installedAppId);
    return new DnaViewModel(host, dnaClient);
  }

  /** Ctor */
  protected constructor(public host: ReactiveElement, protected _dnaClient: DnaClient) {}


  /** -- Fields -- */

  private _allEntryTypes: Dictionary<[string, boolean][]> = {};
  protected _zomeViewModels: Dictionary<IZomeViewModel> = {};

  /** -- Getters -- */

  get entryTypes()  {return this._allEntryTypes}
  get myAgentPubKey() {return this._dnaClient.myAgentPubKey}

  /** -- Methods -- */

  getZomeViewModel(name: string): IZomeViewModel | undefined {
    return this._zomeViewModels[name]
  }

  /** */
  protected async addZomeViewModel(vmClass: {new(dnaClient: DnaClient): IZomeViewModel}) {
    const vm = new vmClass(this._dnaClient);
    vm.provideContext(this.host);
    this._allEntryTypes[vm.zomeName] = await vm.getEntryDefs();
    this._zomeViewModels[vm.zomeName] = vm;
  }

  /** */
  async probeAll() {
    for (const [_name, vm] of Object.entries(this._zomeViewModels)) {
      await vm.probeDht();
    }
  }

  /** */
  dumpLogs(zomeName?: string) {
    this._dnaClient.dumpLogs(zomeName)
  }
}
