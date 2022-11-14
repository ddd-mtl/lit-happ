import {AppWebsocket} from "@holochain/client";
import {HolochainClient} from "@holochain-open-dev/cell-client";
import {DnaClient} from "./DnaClient";
import {IZomeViewModel} from "./ZomeViewModel";
import {ReactiveElement} from "lit";
import {Dictionary} from "@holochain-open-dev/core-types";


/**
 * Class that holds the appWebsocket, DnaClient and all viewModels of the Dna.
 */
export class DnaViewModel {
  /** */
  constructor(public host: ReactiveElement, public port: number, public installedAppId: string) {}

  /** -- Fields -- */

  private _initialized = false;
  private _allEntryTypes: Dictionary<[string, boolean][]> = {};

  protected _viewModels: IZomeViewModel[] = [];
  protected _dnaClient?: DnaClient;


  /** -- Getters -- */

  get initialized() {return this._initialized}
  get entryTypes()  {return this._allEntryTypes}


  /** -- Methods -- */

  dumpLogs(zomeName?: string) {
    this._dnaClient?.dumpLogs(zomeName)
  }

  /** */
  async initialize(port?: number, installedAppId?: string): Promise<void> {
    if (this._initialized) return Promise.reject("AppClient already initialized");
    if (port) this.port = port;
    if (installedAppId) this.installedAppId = installedAppId;
    const wsUrl = `ws://localhost:${this.port}`
    try {
      const appWebsocket = await AppWebsocket.connect(wsUrl)
      console.log({appWebsocket})
      const hcClient = new HolochainClient(appWebsocket)
      /** Setup Context */
      const appInfo = await hcClient.appWebsocket.appInfo({installed_app_id: this.installedAppId})
      const cellId = appInfo.cell_data[0].cell_id;
      this._dnaClient = new DnaClient(hcClient, cellId);
      /** Done */
      this._initialized = true;
      return;
    } catch (e) {
      console.error("AppClient initialization failed", e)
    }
    return Promise.reject("AppClient initialization failed");
  }


  /** */
  async addZomeViewModel(vmClass: {new(dnaClient: DnaClient): IZomeViewModel}) {
    const vm = new vmClass(this._dnaClient!);
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

}
