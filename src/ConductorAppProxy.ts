import {
  AppApi, AppInfoRequest, AppInfoResponse, AppSignal, AppSignalCb, AppWebsocket, CallZomeRequest, CellId
  , InstalledAppId, InstalledCell, RoleId
} from "@holochain/client";
import { Dictionary } from "@holochain-open-dev/core-types";
import { CellProxy } from "./CellProxy";
import {Hcl, CellIdStr, HvmDef, str2CellId, HCL} from "./definitions";
import {areCellsEqual, prettyDate} from "./utils";

/** */
export interface SignalUnsubscriber {
  unsubscribe: () => void;
}


/**
 * Creates, connects and holds a appWebsocket.
 * Creates and holds Cell proxies for this appWebsocket.
 * TODO Implement Singleton per port?
 */
export class ConductorAppProxy implements AppApi {

  /** -- Fields -- */

  private _appWs!: AppWebsocket;

  /** CellIdStr -> AppSignalCb */
  private _signalHandlers: Dictionary<AppSignalCb> = {};
  /** [Timestamp, CellId, Signal] */
  private _signalLogs: [number, string, AppSignal][] = [];
  /** InstalledAppId -> [RoleId] */
  private _installedHapps: Dictionary<Array<InstalledCell>> = {};
  /** HCL -> CellProxy */
  private _cellProxies: Dictionary<CellProxy> = {};

  /** CellIdStr -> HCL */
  private _cellReverseMap: Dictionary<HCL> = {};


  /** -- Getters -- */

  getRoles(installedAppId: InstalledAppId): RoleId[] | undefined {
    if (!this._installedHapps[installedAppId]) return undefined;
    return Object.values(this._installedHapps[installedAppId]).map((installedCell) => {
      return installedCell.role_id;
    });
  }

  /** */
  getInstalledCell(installedAppId: InstalledAppId, roleId: RoleId): InstalledCell {
    const maybeAppInfo = this._installedHapps[installedAppId];
    if (!maybeAppInfo) throw Error("No hApp found with ID " + installedAppId);
    for (const cellData of maybeAppInfo) {
      if (cellData.role_id == roleId) {
        return cellData;
      }
    }
    throw Error(`getInstalledCell() failed: RoleId "${roleId}" not found in happ ${installedAppId}`);
  }


  /** -- AppApi -- */

  // cloneCell
  // archiveCell
  async appInfo(args: AppInfoRequest): Promise<AppInfoResponse> {
    return this._appWs!.appInfo(args);
  }

  /** Passthrough with default timeout */
  async callZome(req: CallZomeRequest, timeout?: number): Promise<any> {
    timeout = timeout ? timeout : this.defaultTimeout
    return this._appWs.callZome(req, timeout)
  }


  /** -- Creation -- */

  /** async Factory */
  static async new(port_or_socket: number | AppWebsocket, defaultTimeout?: number): Promise<ConductorAppProxy> {
    if (port_or_socket instanceof AppWebsocket) {
      return  ConductorAppProxy.fromSocket(port_or_socket);
    } else {
      const timeout = defaultTimeout ? defaultTimeout : 10 * 1000;
      let wsUrl = `ws://localhost:${port_or_socket}`
      try {
        let conductor = new ConductorAppProxy(timeout);
        conductor._appWs = await AppWebsocket.connect(wsUrl, timeout, (sig) => {conductor.onSignal(sig)})
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
      console.warn("Using pre-existing AppWebsocket. ConductorAppProxy's 'onSignal()' SignalHandler needs to be set by the provider of the AppWebsocket.")
      return conductor;
    } catch (e) {
      console.error("ConductorAppProxy initialization failed", e)
      return Promise.reject("ConductorAppProxy initialization failed");
    }
  }

  /** Ctor */
  private constructor(public defaultTimeout: number) {
    //const _unsubscribe = _appWs.addSignalHandler(this.onSignal);
    const _unsub = this.addSignalHandler((sig) => this.logSignal(sig));
  }


  /** -- Methods -- */


  getCellLocation(cellId: CellId): HCL | undefined {
    const str = CellIdStr(cellId);
    return this._cellReverseMap[str];
  }

  /** Get stored CellProxy or attempt to create it */
   getCellProxy(installedAppId: InstalledAppId, roleId: RoleId): CellProxy {
    const hcl = Hcl(installedAppId, roleId);
    let maybeProxy = this._cellProxies[hcl];
    if (!maybeProxy) {
      throw Error(`getCellProxy() failed: No Cell found for RoleId "${roleId}" in happ ${installedAppId}`);
    }
    return maybeProxy;
  }


  /** */
  async createCellProxy(installedAppId: InstalledAppId, roleId: RoleId): Promise<void> {
    const hcl = Hcl(installedAppId, roleId);
    let maybeProxy = this._cellProxies[hcl];
    if (maybeProxy) {
      console.warn("Cell already created", hcl);
      return;
    }
    const installedAppInfo = await this.appInfo({installed_app_id: installedAppId});
    this._installedHapps[installedAppId] = installedAppInfo.cell_data;
    const installedCell = this.getInstalledCell(installedAppId, roleId);
    const cellProxy = new CellProxy(this, installedCell, this.defaultTimeout);
    this._cellProxies[hcl] = cellProxy;
    this._cellReverseMap[CellIdStr(cellProxy.cellId)] = hcl;
  }

  async createCellProxies(hvmDef: HvmDef): Promise<void> {
    for (const dvmDef of hvmDef.dvmDefs) {
      let roleId;
      if (Array.isArray(dvmDef)) {
        roleId = dvmDef[1];
      } else {
        roleId = dvmDef.DEFAULT_ROLE_ID;
      }
      await this.createCellProxy(hvmDef.id, roleId);
    }
  }

  /** */
  onSignal(signal: AppSignal): void {
    for (const [cellIdStr, handler] of Object.entries(this._signalHandlers)) {
      if (cellIdStr !== "" && !areCellsEqual(str2CellId(cellIdStr), signal.data.cellId)) {
        continue;
      }
      handler(signal);
    }
  }


  /** */
  dumpSignals(cellId?: CellId) {
    if (cellId) {
      const cellStr = CellIdStr(cellId);
      console.warn("Dumping signal logs for cell", this._cellReverseMap[cellStr])
      const logs = this._signalLogs
        .filter((log) => log[1] == cellStr)
        .map((log) => {
          return { timestamp: prettyDate(new Date(log[0])), payload: log[2].data.payload}
        });
      console.table(logs);
    } else {
      console.warn("Dumping all signal logs")
      const logs = this._signalLogs
        .map((log) => {
          return { timestamp: prettyDate(new Date(log[0])), cell: this._cellReverseMap[log[1]], payload: log[2].data.payload}
        });
      console.table(logs);
    }
  }

  /** Log all signals received */
  private logSignal(signal: AppSignal): void {
    this._signalLogs.push([Date.now(), CellIdStr(signal.data.cellId), signal])
    //console.log("signal logged", this._signalLogs)
  }


  /** Store signalHandler to internal handler array */
  addSignalHandler(handler: AppSignalCb, cellId?: CellId): SignalUnsubscriber {
    const cellIdStr = cellId? CellIdStr(cellId): "";
    //const maybeHandler = this._signalHandlers[cellIdStr]
    if (cellId) {
      const maybeHandler = Object.getOwnPropertyDescriptor(this._signalHandlers, cellIdStr);
      if (maybeHandler && maybeHandler.value) {
        throw new Error(`SignalHandler already added to CellProxy ${cellIdStr}`);
      }
    }
    this._signalHandlers[cellIdStr] = handler;
    /* return tailored unsubscribe function to the caller */
    return {
      unsubscribe: () => {
        const maybeHandler = this._signalHandlers[cellIdStr]
        if (!maybeHandler) {
          console.warn("unsubscribe failed: Couldn't find signalHandler for CellProxy", cellId)
          return;
        }
        delete this._signalHandlers[cellIdStr];
      }
    };
  }

}
