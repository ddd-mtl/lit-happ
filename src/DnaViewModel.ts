import {DnaClient} from "./DnaClient";
import {IZomeViewModel} from "./ZomeViewModel";
import {ReactiveElement} from "lit";
import {Dictionary} from "@holochain-open-dev/core-types";


/**
 * Class that holds the appWebsocket, DnaClient and all viewModels of the Dna.
 */
export class DnaViewModel {
  /** async Factory */
  static async new(host: ReactiveElement, port: number, installedAppId: string): Promise<DnaViewModel> {
    let dnaClient = await DnaClient.new(port, installedAppId);
    return new DnaViewModel(host, dnaClient);
  }

  /** Ctor */
  constructor(public host: ReactiveElement, protected _dnaClient: DnaClient) {}


  /** -- Fields -- */

  private _allEntryTypes: Dictionary<[string, boolean][]> = {};
  protected _viewModels: IZomeViewModel[] = [];

  /** -- Getters -- */

  get entryTypes()  {return this._allEntryTypes}


  /** -- Methods -- */

  /** */
  async addZomeViewModel(vmClass: {new(dnaClient: DnaClient): IZomeViewModel}) {
    const vm = new vmClass(this._dnaClient);
    vm.provideContext(this.host);
    this._allEntryTypes[vm.zomeName] = await vm.getEntryDefs();
    this._viewModels.push(vm);
  }

  /** */
  async probeAll() {
    for (const vm of this._viewModels) {
      await vm.probeDht();
    }
  }

  /** */
  dumpLogs(zomeName?: string) {
    this._dnaClient.dumpLogs(zomeName)
  }
}
