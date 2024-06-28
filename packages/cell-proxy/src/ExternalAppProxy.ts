import {
  AppInfoResponse,
  CallZomeRequest,
  DisableCloneCellRequest,
  EnableCloneCellRequest,
  ClonedCell,
  AppClient,
  AppEvents,
  AppSignalCb,
  AppCreateCloneCellRequest,
  CreateCloneCellResponse,
  AppNetworkInfoRequest, NetworkInfoResponse,
} from "@holochain/client";
import { UnsubscribeFunction } from "emittery";
import {AppProxy} from "./AppProxy";


/**
 *
 */
export class ExternalAppProxy extends AppProxy implements AppClient {

  /** Ctor */
  /*protected*/ constructor(private _appClient: AppClient, defaultTimeout: number) {
    super(defaultTimeout, _appClient.installedAppId, _appClient.myPubKey);
  }



  /** -- AppClient (Passthrough to external AppClient) -- */

  //get myPubKey(): AgentPubKey { return this._appClient.myPubKey}
  //get installedAppId(): InstalledAppId { return this._appClient.installedAppId}

  async callZome(req: CallZomeRequest, timeout?: number): Promise<unknown> {
    timeout = timeout ? timeout : this.defaultTimeout
    return this._appClient.callZome(req, timeout)
  }

  on<Name extends keyof AppEvents>(
    eventName: Name | readonly Name[],
    listener: AppSignalCb
  ): UnsubscribeFunction {
    return this._appClient.on(eventName, listener);
  }

  async appInfo(): Promise<AppInfoResponse> {
    return this._appClient.appInfo();
  }

  async createCloneCell(request: AppCreateCloneCellRequest): Promise<CreateCloneCellResponse> {
    return this._appClient.createCloneCell(request);
  }

  async enableCloneCell(request: EnableCloneCellRequest): Promise<ClonedCell> {
    return this._appClient.enableCloneCell(request);
  }

  async disableCloneCell(request: DisableCloneCellRequest): Promise<void> {
    return this._appClient.disableCloneCell(request);
  }

  networkInfo(args: AppNetworkInfoRequest): Promise<NetworkInfoResponse> {
    return this._appClient.networkInfo(args);
  }

}

