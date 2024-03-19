import {
  AppApi,
  AppInfoRequest,
  AppInfoResponse,
  AppWebsocket,
  CallZomeRequest,
  InstalledAppId,
  CreateCloneCellRequest,
  DisableCloneCellRequest,
  EnableCloneCellRequest,
  ClonedCell, decodeHashFromBase64, DnaHashB64, NetworkInfo, NetworkInfoRequest, AgentPubKeyB64, Timestamp,
} from "@holochain/client";
import {AppProxy} from "./AppProxy";
import {CellIdStr} from "./types";


/**
 * Creates, connects and holds an appWebsocket.
 * Creates and holds Cell proxies for this appWebsocket.
 * Maintains a mapping between CellIds and HCLs
 * Handles SignalHandlers per HCL
 * Stores appSignal logs
 * TODO Implement Singleton per App port?
 */
export class ConductorAppProxy extends AppProxy implements AppApi {

  /** -- Fields -- */

  private _appWs!: AppWebsocket;


  /** -- Getters -- */

  /** Check this after connecting since AppWebsocket can shamelessly override the provided args. */
  get appIdOfShame(): InstalledAppId | undefined { return this._appWs.overrideInstalledAppId;}


  async createCloneCell(request: CreateCloneCellRequest): Promise<ClonedCell> {
    //console.log("createCloneCell() called:", request)
    return this._appWs!.createCloneCell(request);
  }

  /** -- AppApi (Passthrough to appWebsocket) -- */

  async enableCloneCell(request: EnableCloneCellRequest): Promise<ClonedCell> {
    //console.log("enableCloneCell() called:", request)
    return this._appWs!.enableCloneCell(request);
  }

  async disableCloneCell(request: DisableCloneCellRequest): Promise<void> {
    //console.log("disableCloneCell() called:", request)
    return this._appWs!.disableCloneCell(request);
  }

  async appInfo(args: AppInfoRequest): Promise<AppInfoResponse> {
    return this._appWs!.appInfo(args);
  }

  async callZome(req: CallZomeRequest, timeout?: number): Promise<unknown> {
    timeout = timeout ? timeout : this.defaultTimeout
    return this._appWs.callZome(req, timeout)
  }


  /** Store networkInfo calls */
  private _lastTimeQueriedMap: Record<AgentPubKeyB64, Timestamp> = {};
  private _networkInfoLogs: Record<CellIdStr, [Timestamp, NetworkInfo][]> = {};

  get networkInfoLogs(): Record<CellIdStr, [Timestamp, NetworkInfo][]> {return this._networkInfoLogs;}

  /** */
  async networkInfo(agent: AgentPubKeyB64, dnas: DnaHashB64[]): Promise<Record<DnaHashB64, [Timestamp, NetworkInfo]>> {
    const hashs = dnas.map((b64) => decodeHashFromBase64(b64));
    /* Call networkInfo */
    const response = await this._appWs.networkInfo({
      agent_pub_key: decodeHashFromBase64(agent),
      dnas: hashs,
      last_time_queried: this._lastTimeQueriedMap[agent]} as NetworkInfoRequest);
    this._lastTimeQueriedMap[agent] = Date.now();

    /* Convert result */
    let i = 0;
    let result = {}
    for (const netInfo of response) {
      result[dnas[i]] = [this._lastTimeQueriedMap[agent], netInfo];
      /* Store */
      const cellIdStr = CellIdStr(decodeHashFromBase64(dnas[i]), decodeHashFromBase64(agent));
      if (!this._networkInfoLogs[cellIdStr]) {
        this._networkInfoLogs[cellIdStr] = [];
      }
      this._networkInfoLogs[cellIdStr].push([this._lastTimeQueriedMap[agent], netInfo])
      /* */
      i += 1;
    }
    return result;
  }


/** -- Creation -- */

  /** async Factory */
  static async new(port_or_socket: number | AppWebsocket, defaultTimeout?: number): Promise<ConductorAppProxy> {
    if (typeof port_or_socket == 'object') {
      return  ConductorAppProxy.fromSocket(port_or_socket);
    } else {
      const timeout = defaultTimeout ? defaultTimeout : 10 * 1000;
      let wsUrl = new URL(`ws://localhost:${port_or_socket}`);
      try {
        let conductor = new ConductorAppProxy(timeout);

        /** AppWebsocket */
        const appWs = await AppWebsocket.connect({url: wsUrl, defaultTimeout: timeout});

        /** AppAgentWebsocket */
        // const appAgentWs = await AppAgentWebsocket.connect(`ws://localhost:${process.env.HC_APP_PORT}`, "playground");
        // console.log(appAgentWs.appWebsocket);
        // const appWs = await appAgentWs.appWebsocket;

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
  private static async fromSocket(appWebsocket: AppWebsocket): Promise<ConductorAppProxy> {
    try {
      let conductor = new ConductorAppProxy(appWebsocket.defaultTimeout);
      conductor._appWs = appWebsocket;
      conductor._appWs.on('signal', (sig) => {conductor.onSignal(sig)})
      return conductor;
    } catch (e) {
      console.error("ConductorAppProxy initialization failed", e)
      return Promise.reject("ConductorAppProxy initialization failed");
    }
  }


  /** Ctor */
  /*protected*/ constructor(public defaultTimeout: number) {
    super(defaultTimeout);
  }

}

