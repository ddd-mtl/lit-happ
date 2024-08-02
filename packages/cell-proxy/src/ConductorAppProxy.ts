import {
  AppInfoResponse,
  AppWebsocket,
  CallZomeRequest,
  InstalledAppId,
  CreateCloneCellRequest,
  DisableCloneCellRequest,
  EnableCloneCellRequest,
  ClonedCell,
  NetworkInfo,
  NetworkInfoRequest,
  Timestamp,
  AppClient,
  AppEvents,
  AppSignalCb,
  AppNetworkInfoRequest,
  NetworkInfoResponse,
  AdminWebsocket,
} from "@holochain/client";
import { UnsubscribeFunction } from "emittery";
import {AppProxy} from "./AppProxy";
import {CellAddress, CellIdStr} from "./types";
import {AgentId, DnaId} from "./hash";
import {AgentIdMap} from "./holochain-id-map";


/**
 * Creates, connects and holds an appWebsocket.
 * Creates and holds Cell proxies for this appWebsocket.
 * Maintains a mapping between CellIds and HCLs
 * Handles SignalHandlers per HCL
 * Stores appSignal logs
 * TODO Implement Singleton per App port?
 */
export class ConductorAppProxy extends AppProxy implements AppClient {

  /** -- Fields -- */

  private _appWs!: AppWebsocket;


  /** -- Getters -- */

  ///** Check this after connecting since AppWebsocket can shamelessly override the provided args. */
  //get appIdOfShame(): InstalledAppId | undefined { return this._appWs.overrideInstalledAppId;}


  /** -- AppClient (Passthrough to appWebsocket) -- */

  async callZome(req: CallZomeRequest, timeout?: number): Promise<unknown> {
    timeout = timeout ? timeout : this.defaultTimeout
    return this._appWs.callZome(req, timeout)
  }

  async appInfo(): Promise<AppInfoResponse> {
    return this._appWs!.appInfo();
  }

  on<Name extends keyof AppEvents>(
    eventName: Name | readonly Name[],
    listener: AppSignalCb
  ): UnsubscribeFunction {
    return this._appWs!.on(eventName, listener);
  }

  async createCloneCell(request: CreateCloneCellRequest): Promise<ClonedCell> {
    //console.log("createCloneCell() called:", request)
    return this._appWs!.createCloneCell(request);
  }

  async enableCloneCell(request: EnableCloneCellRequest): Promise<ClonedCell> {
    //console.log("enableCloneCell() called:", request)
    return this._appWs!.enableCloneCell(request);
  }

  async disableCloneCell(request: DisableCloneCellRequest): Promise<void> {
    //console.log("disableCloneCell() called:", request)
    return this._appWs!.disableCloneCell(request);
  }

  // async networkInfo(args: AppNetworkInfoRequest): Promise<NetworkInfoResponse> {
  //   return this._appWs!.networkInfo(args);
  // }


  /** */
  async networkInfo(args: AppNetworkInfoRequest): Promise<NetworkInfoResponse> {
    const agentId = new AgentId(this._appWs.myPubKey);
    /* Call networkInfo */
    const response = await this._appWs.networkInfo({
      dnas: args.dnas,
      last_time_queried: this._lastTimeQueriedMap.get(agentId)
    } as NetworkInfoRequest);
    this._lastTimeQueriedMap.set(agentId, Date.now());

    /* Convert result */
    let i = 0;
    //let result = {}
    for (const netInfo of response) {
      const dnaId = new DnaId(args.dnas[i]);
      //result[dnaHash] = [this._lastTimeQueriedMap[agent], netInfo];
      /* Store */
      const cellAddr = new CellAddress(dnaId, agentId);
      if (!this._networkInfoLogs[cellAddr.str]) {
        this._networkInfoLogs[cellAddr.str] = [];
      }
      this._networkInfoLogs[cellAddr.str].push([this._lastTimeQueriedMap.get(agentId), netInfo])
      /* */
      i += 1;
    }
    return response;
  }



  /** Store networkInfo calls */
  //private _lastTimeQueriedMap: Record<AgentPubKeyB64, Timestamp> = {};
  private _lastTimeQueriedMap: AgentIdMap<Timestamp> = new AgentIdMap();

  private _networkInfoLogs: Record<CellIdStr, [Timestamp, NetworkInfo][]> = {};

  get networkInfoLogs(): Record<CellIdStr, [Timestamp, NetworkInfo][]> {return this._networkInfoLogs;}



/** -- Creation -- */

  /** async Factory */
  static async new(port_or_socket: number | AppWebsocket, appId: InstalledAppId, adminUrl?: URL, defaultTimeout?: number): Promise<ConductorAppProxy> {
    const timeout = defaultTimeout ? defaultTimeout : 10 * 1000;
    if (typeof port_or_socket == 'object') {
      return  ConductorAppProxy.fromSocket(port_or_socket, timeout);
    } else {
      let wsUrl = new URL(`ws://localhost:${port_or_socket}`);
      try {
        let token;
        let adminWs: AdminWebsocket;
        if (adminUrl) {
          adminWs = await AdminWebsocket.connect({url: adminUrl});
          console.log({adminWs});
          const issued = await adminWs.issueAppAuthenticationToken({installed_app_id: appId});
          token = issued.token;
        }
        const appWs = await AppWebsocket.connect({url: wsUrl, defaultTimeout: timeout, token});
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


  /** Ctor */
  /*protected*/ constructor(public defaultTimeout: number, appId: InstalledAppId, agentId: AgentId, adminWs?: AdminWebsocket) {
    super(defaultTimeout, appId, agentId, adminWs);
  }

}

