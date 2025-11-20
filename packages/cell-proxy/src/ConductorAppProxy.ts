import {
  AppInfoResponse,
  AppWebsocket,
  CallZomeRequest,
  InstalledAppId,
  CreateCloneCellRequest,
  DisableCloneCellRequest,
  EnableCloneCellRequest,
  ClonedCell,
  AppClient,
  AppEvents,
  SignalCb,
  AdminWebsocket,
  CreateCloneCellResponse,
  EnableCloneCellResponse,
  DumpNetworkMetricsRequest,
  DumpNetworkMetricsResponse,
} from "@holochain/client";
import { UnsubscribeFunction } from "emittery";
import {AppProxy} from "./AppProxy";
import {AgentId} from "./hash";
import {AppWebsocketConnectionOptions, AppAuthenticationToken} from "@holochain/client";
import {AppDumpNetworkStatsResponse} from "@holochain/client/lib/api/admin";


export interface CellCloner {
  /*async*/ createCloneCell(req: CreateCloneCellRequest, publicToGroupMembers: boolean): Promise<CreateCloneCellResponse>,
  /*async*/ enableCloneCell(req: EnableCloneCellRequest): Promise<EnableCloneCellResponse>,
  /*async*/ disableCloneCell(req: DisableCloneCellRequest): Promise<void>,
}


/**
 * Creates, connects and holds an appWebsocket.
 * Creates and holds Cell proxies for this appWebsocket.
 * Maintains a mapping between CellIds and HCLs
 * Handles SignalHandlers per HCL
 * Stores appSignal logs
 * TODO Implement Singleton per App port?
 */
export class ConductorAppProxy extends AppProxy implements AppClient {

  /** Ctor */
  /*protected*/ constructor(defaultTimeout: number, appId: InstalledAppId, agentId: AgentId, adminWs?: AdminWebsocket) {
    super(defaultTimeout, appId, agentId, adminWs);
  }


  /** -- Fields -- */

  private _appWs!: AppWebsocket;


  /** -- Getters -- */

  ///** Check this after connecting since AppWebsocket can shamelessly override the provided args. */
  //get appIdOfShame(): InstalledAppId | undefined { return this._appWs.overrideInstalledAppId;}


  /** -- AppClient (Passthrough to appWebsocket) -- */

  override async callZome(req: CallZomeRequest, timeout?: number): Promise<unknown> {
    timeout = timeout ? timeout : this.defaultTimeout
    return this._appWs.callZome(req, timeout)
  }

  override async appInfo(): Promise<AppInfoResponse> {
    return this._appWs!.appInfo();
  }

  override on<Name extends keyof AppEvents>(
    eventName: Name | readonly Name[],
    listener: SignalCb
  ): UnsubscribeFunction {
    return this._appWs!.on(eventName, listener);
  }

  override async createCloneCell(request: CreateCloneCellRequest): Promise<ClonedCell> {
    //console.log("createCloneCell() called:", request)
    return this._appWs!.createCloneCell(request);
  }

  override async enableCloneCell(request: EnableCloneCellRequest): Promise<ClonedCell> {
    //console.log("enableCloneCell() called:", request)
    return this._appWs!.enableCloneCell(request);
  }

  override async disableCloneCell(request: DisableCloneCellRequest): Promise<void> {
    //console.log("disableCloneCell() called:", request)
    return this._appWs!.disableCloneCell(request);
  }


  override async dumpNetworkStats(): Promise<AppDumpNetworkStatsResponse> {
    return await this._appWs!.dumpNetworkStats();
  }

  override async dumpNetworkMetrics(
    req: DumpNetworkMetricsRequest,
    timeout?: number
  ): Promise<DumpNetworkMetricsResponse> {
    return await this._appWs!.dumpNetworkMetrics(req, timeout);
  }



  /** -- Creation -- */

  /** async Factory */
  static async new(port_or_socket: number | AppWebsocket, appId: InstalledAppId, adminUrl?: URL, defaultTimeout?: number): Promise<ConductorAppProxy> {
    const timeout = defaultTimeout ? defaultTimeout : 10 * 1000;
    if (typeof port_or_socket == 'object') {
      return  ConductorAppProxy.fromSocket(port_or_socket, timeout);
    } else {
      let wsUrl = new URL(`ws://localhost:${port_or_socket}`);
      try {
        let token: AppAuthenticationToken | undefined = undefined;
        let adminWs: AdminWebsocket | undefined = undefined;
        if (adminUrl) {
          adminWs = await AdminWebsocket.connect({url: adminUrl});
          console.log({adminWs});
          const issued = await adminWs.issueAppAuthenticationToken({installed_app_id: appId});
          token = issued.token;
        }
        const options: AppWebsocketConnectionOptions = {
          url: wsUrl,
          defaultTimeout: timeout,
        };
        if (token) {
          options.token = token;
        }
        const appWs = await AppWebsocket.connect(options);
        const agentId = new AgentId(appWs.myPubKey);
        //console.log("appWs.myPubKey", appWs.myPubKey, agentId);
        let conductor = new ConductorAppProxy(timeout, appId, agentId, adminWs);
        conductor._appWs = appWs;
        conductor._appWs.on('signal', (sig) => {conductor.onSignal(sig)});
        return conductor;
      } catch (e) {
        console.error("ConductorAppProxy initialization failed", e)
        return Promise.reject("ConductorAppProxy initialization failed");
      }
    }
  }


  /** */
  private static async fromSocket(appWebsocket: AppWebsocket, defaultTimeout: number): Promise<ConductorAppProxy> {
    try {
      let conductor = new ConductorAppProxy(defaultTimeout, appWebsocket.installedAppId, new AgentId(appWebsocket.myPubKey));
      conductor._appWs = appWebsocket;
      conductor._appWs.on('signal', (sig) => {conductor.onSignal(sig)})
      return conductor;
    } catch (e) {
      console.error("ConductorAppProxy initialization failed", e)
      return Promise.reject("ConductorAppProxy initialization failed");
    }
  }
}

