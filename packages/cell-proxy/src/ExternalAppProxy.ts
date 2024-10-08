import {
  AppInfoResponse,
  CallZomeRequest,
  DisableCloneCellRequest,
  EnableCloneCellRequest,
  ClonedCell,
  AppClient,
  AppEvents,
  SignalCb,
  AppCreateCloneCellRequest,
  CreateCloneCellResponse,
  AppNetworkInfoRequest, NetworkInfoResponse,
} from "@holochain/client";
import { UnsubscribeFunction } from "emittery";
import {AppProxy} from "./AppProxy";
import {AgentId} from "./hash";


/**
 *
 */
export class ExternalAppProxy extends AppProxy implements AppClient {

  /** Ctor */
  /*protected*/ constructor(private _appClient: AppClient, defaultTimeout: number) {
    super(defaultTimeout, _appClient.installedAppId, new AgentId(_appClient.myPubKey));
  }



  /** -- AppClient (Passthrough to external AppClient) -- */

  //get myPubKey(): AgentPubKey { return this._appClient.myPubKey}
  //get installedAppId(): InstalledAppId { return this._appClient.installedAppId}

  override async callZome(req: CallZomeRequest, timeout?: number): Promise<unknown> {
    timeout = timeout ? timeout : this.defaultTimeout
    return this._appClient.callZome(req, timeout)
  }

  override on<Name extends keyof AppEvents>(
    eventName: Name | readonly Name[],
    listener: SignalCb
  ): UnsubscribeFunction {
    return this._appClient.on(eventName, listener);
  }

  override async appInfo(): Promise<AppInfoResponse> {
    return this._appClient.appInfo();
  }

  override async createCloneCell(request: AppCreateCloneCellRequest): Promise<CreateCloneCellResponse> {
    return this._appClient.createCloneCell(request);
  }

  override async enableCloneCell(request: EnableCloneCellRequest): Promise<ClonedCell> {
    return this._appClient.enableCloneCell(request);
  }

  override async disableCloneCell(request: DisableCloneCellRequest): Promise<void> {
    return this._appClient.disableCloneCell(request);
  }

  override networkInfo(args: AppNetworkInfoRequest): Promise<NetworkInfoResponse> {
    return this._appClient.networkInfo(args);
  }

}

