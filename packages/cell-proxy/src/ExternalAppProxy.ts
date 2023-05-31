import {
  AppApi,
  AppInfoRequest,
  AppInfoResponse,
  CallZomeRequest,
  DisableCloneCellRequest,
  EnableCloneCellRequest,
  ClonedCell,
} from "@holochain/client";
import {AppProxy} from "./AppProxy";


/**
 *
 */
export class ExternalAppProxy extends AppProxy implements AppApi {

  /** Ctor */
  /*protected*/ constructor(private _appApi: AppApi, defaultTimeout: number) {
    super(defaultTimeout);
    /*const _unsub =*/ this.addSignalHandler((sig) => this.logSignal(sig));
  }



  /** -- AppApi (Passthrough to external AppApi) -- */

  async enableCloneCell(request: EnableCloneCellRequest): Promise<ClonedCell> {
    //console.log("enableCloneCell() called:", request)
    return this._appApi.enableCloneCell(request);
  }

  async disableCloneCell(request: DisableCloneCellRequest): Promise<void> {
    //console.log("disableCloneCell() called:", request)
    return this._appApi.disableCloneCell(request);
  }
  async appInfo(args: AppInfoRequest): Promise<AppInfoResponse> {
    return this._appApi.appInfo(args);
  }

  async callZome(req: CallZomeRequest, timeout?: number): Promise<unknown> {
    timeout = timeout ? timeout : this.defaultTimeout
    return this._appApi.callZome(req, timeout)
  }


}

