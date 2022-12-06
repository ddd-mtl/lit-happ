import {
  AppApi, AppInfoRequest, AppInfoResponse, AppSignal,
  AppSignalCb, AppWebsocket, CallZomeRequest, CellId,
  InstalledAppId, InstalledAppInfo, InstalledCell,
} from "@holochain/client";
import { Dictionary } from "@holochain-open-dev/core-types";
import { CellProxy } from "./CellProxy";
import {
  CellIdStr, str2CellId, destructureRoleInstanceId,
  HCL, CloneIndex, CellLocation, InstalledCellsMap, BaseRoleName, RoleInstanceId, RoleInstalledCells,
} from "./types";
import {areCellsEqual, prettyDate, printAppInfo} from "./utils";
import {ArchiveCloneCellRequest, CreateCloneCellRequest} from "@holochain/client/lib/api/app/types";


/** */
export interface SignalUnsubscriber {
  unsubscribe: () => void;
}


/**
 * Creates, connects and holds a appWebsocket.
 * Creates and holds Cell proxies for this appWebsocket.
 * Maintains a mapping between CellIds and HCLs
 * Handles SignalHandlers per HCL
 * Stores appSignal logs
 * TODO Implement Singleton per App port?
 */
export class ConductorAppProxy implements AppApi {

  /** -- Fields -- */

  private _appWs!: AppWebsocket;

  /** [Timestamp, CellIdStr, Signal] */
  private _signalLogs: [number, CellIdStr, AppSignal][] = [];

  /** InstalledAppId -> (BaseRoleName -> RoleInstalledCells) */
  private _installedCellsByApp: Dictionary<InstalledCellsMap> = {};
  /** CellIdStr -> [HCL] */
  private _hclMap: Dictionary<HCL[]> = {};

  /** HCL -> AppSignalCb */
  private _signalHandlers: Dictionary<AppSignalCb> = {};

  /** CellIdStr -> CellProxy */
  private _cellProxies: Dictionary<CellProxy> = {};


  /** -- Getters -- */

  /** */
  getAppCells(appId: InstalledAppId): InstalledCellsMap | undefined {
    return this._installedCellsByApp[appId];
  }

  /** */
  getHcls(cellId: CellId): HCL[] | undefined {
    return this._hclMap[CellIdStr(cellId)];
  }

  /** */
  getInstalledCellByLocation(cellLoc: CellLocation): InstalledCell | undefined {
    try {
      return this.getInstalledCell(cellLoc.appId, cellLoc.baseRoleName, cellLoc.cloneIndex);
    } catch(e) {
      //console.warn(e);
      return undefined;
    }
  }

  /** */
  getCellProxy(cellId: CellId): CellProxy | undefined {
    const sId = CellIdStr(cellId);
    return this._cellProxies[sId];
  }

  /** Get stored CellProxy or attempt to create it */
  getCellProxyByLocation(cellLoc: CellLocation): CellProxy {
    const installedCell = this.getInstalledCell(cellLoc.appId, cellLoc.baseRoleName, cellLoc.cloneIndex);
    const maybeProxy = this.getCellProxy(installedCell.cell_id);
    if (!maybeProxy) throw Error("getCellProxyByLocation() failed. Proxy not found for cell " + CellIdStr(installedCell.cell_id));
    return maybeProxy;
  }

  /** */
  getRoles(installedAppId: InstalledAppId): RoleInstanceId[] | undefined {
    if (!this._installedCellsByApp[installedAppId]) return undefined;
    return Object.values(this._installedCellsByApp[installedAppId]).map((roleCells) => {
      return roleCells.original.role_id;
    });
  }

  /** */
  getClones(appId: InstalledAppId, baseRoleName: BaseRoleName): InstalledCell[] {
    const maybeApp = this._installedCellsByApp[appId]
    if (!maybeApp) return [];
    const roleInstalledCells = maybeApp[baseRoleName];
    if (!roleInstalledCells) return [];
    return Object.values(roleInstalledCells.clones);
  }

  /** */
  getInstalledCell(installedAppId: InstalledAppId, baseRoleName: BaseRoleName, cloneIndex?: CloneIndex): InstalledCell {
    const roleCellsMap = this._installedCellsByApp[installedAppId];
    if (!roleCellsMap) throw Error(`getInstalledCell() failed. No hApp with ID "${installedAppId}" found.`);
    const roleCells = roleCellsMap[baseRoleName];
    if (!roleCells) throw Error(`getInstalledCell() failed: BaseRoleName "${baseRoleName}" not found in happ "${installedAppId}"`);
    if (cloneIndex !== undefined) {
      const clone = roleCells.clones[""+cloneIndex];
      if (!clone) {
        throw Error(`getInstalledCell() failed: cloneIndex "${cloneIndex}" not found for role "${installedAppId}/${baseRoleName}"`);
      }
      return roleCells.clones[""+cloneIndex];
    }
    return roleCells.original;
  }

  /** -- AppApi (Passthrough to appWebsocket) -- */

  async createCloneCell(request: CreateCloneCellRequest): Promise<InstalledCell> {
    console.log("createCloneCell() called:", request)
    return this._appWs!.createCloneCell(request);
  }

  async archiveCloneCell(request: ArchiveCloneCellRequest): Promise<void> {
    console.log("archiveCloneCell() called:", request)
    this._appWs!.archiveCloneCell(request);
  }

  async appInfo(args: AppInfoRequest): Promise<AppInfoResponse> {
    return this._appWs!.appInfo(args);
  }

  async callZome(req: CallZomeRequest, timeout?: number): Promise<any> {
    timeout = timeout ? timeout : this.defaultTimeout
    return this._appWs.callZome(req, timeout)
  }


  /** -- Creation -- */

  /** async Factory */
  static async new(port_or_socket: number | AppWebsocket, defaultTimeout?: number): Promise<ConductorAppProxy> {
    if (typeof port_or_socket == 'object') {
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

  async createRoleInstalledCells(installed_app_id: InstalledAppId, baseRoleName: BaseRoleName): Promise<RoleInstalledCells> {
    /** Make sure hApp exists */
    const installedAppInfo: any = await this.appInfo({installed_app_id});
    if (installedAppInfo == null) {
      Promise.reject(`createCellProxy() failed. App "${installed_app_id}" not found on AppWebsocket "${this._appWs.client.socket.url}"`)
    }
    console.log("createRoleInstalledCells() installedAppInfo:\n", printAppInfo(installedAppInfo));
    /** Make sure app Object exists */
    if (!this._installedCellsByApp[installed_app_id]) {
      this._installedCellsByApp[installed_app_id] = {};
    }
    /** Get all cells with that baseRoleName */
    let original;
    let clones: Dictionary<InstalledCell> = {};
    for (const curCell of installedAppInfo.cell_data) {
      //console.log(`CreateCellProxy(): Found cell "${installedCell.role_id}":`, CellIdStr(installedCell.cell_id));
      const maybePair = destructureRoleInstanceId(curCell.role_id);
      const curBaseName = maybePair ? maybePair[0] : curCell.role_id;
      if (curBaseName !== baseRoleName) {
        continue;
      }
      if (maybePair) {
        if (clones["" + maybePair[1]]) {
          console.error(`createRoleInstalledCells() Proxy already exist for clone: "${maybePair[0]}/${maybePair[1]}"`)
        }
        clones["" + maybePair[1]] = curCell;
      } else {
        original = curCell;
      }
    }
    if (!original) {
      Promise.reject("Original cell not found for role " + baseRoleName);
    }
    let roleInstalledCells = {original, clones}
    /** Store it*/
    this._installedCellsByApp[installed_app_id][baseRoleName] = roleInstalledCells;
    return roleInstalledCells;
  }


  /** */
  addCloneInstalledCell(cellLoc: CellLocation, cloneCell: InstalledCell): void {
    if (!this._installedCellsByApp[cellLoc.appId]) throw Error("addCloneInstalledCell() failed. no appId. " + cellLoc.asHcl());
    if (!this._installedCellsByApp[cellLoc.appId][cellLoc.baseRoleName]) throw Error("addCloneInstalledCell() failed. no baseRoleName. " + cellLoc.asHcl());
    if (cellLoc.cloneIndex === undefined) throw Error("addCloneInstalledCell() failed. Missing cloneIndex " + cellLoc.asHcl());
    this._installedCellsByApp[cellLoc.appId][cellLoc.baseRoleName].clones[cellLoc.cloneIndex] = cloneCell;
    // const sCellId = CellIdStr(cloneCell.cell_id);
    // console.log("CreateCellProxy() adding to hclMap", sCellId, cellLoc.asHcl())
    // if (this._hclMap[sCellId]) {
    //   this._hclMap[sCellId].push(cellLoc.asHcl());
    // } else {
    //   this._hclMap[sCellId] = [cellLoc.asHcl()];
    // }
  }

  /** */
  createCellProxy(installedAppId: InstalledAppId, baseRoleName: BaseRoleName, cloneIndex?: CloneIndex): CellProxy {
    /** Build HCL */
    const cellLoc = CellLocation.from(installedAppId, baseRoleName, cloneIndex);
    const hcl = cellLoc.asHcl();
    console.log("createCellProxy() for", hcl);
    /** Make sure cell exists */
    const maybeInstalledCell = this.getInstalledCellByLocation(cellLoc);
    if (!maybeInstalledCell) {
      Promise.reject("createCellProxy() failed. Cell not found for " + hcl);
    }
    console.log("createCellProxy() Currently stored cellProxies:", this._cellProxies);
    const sCellId = CellIdStr(maybeInstalledCell!.cell_id);
    /** Create proxy for this cell if none exist yet, otherwise reuse */
    let cellProxy = this._cellProxies[sCellId];
    if (!cellProxy) {
      const roleInstalledCells = this._installedCellsByApp[installedAppId][baseRoleName];
      /** Make sure cell exists */
      if (!roleInstalledCells || cloneIndex !== undefined && cloneIndex >= Object.values(roleInstalledCells!.clones).length) {
        Promise.reject(`createCellProxy() failed. Cell "${hcl}" not found on AppWebsocket "${this._appWs.client.socket.url}"`)
      }
      //console.log({_installedCells: this._installedCells})
      const installedCell = cloneIndex !== undefined ? roleInstalledCells!.clones[cloneIndex] : roleInstalledCells!.original;
      /** Create and store Proxy */
      cellProxy = new CellProxy(this, installedCell, this.defaultTimeout);
      this._cellProxies[sCellId] = cellProxy;
    }
    /** Create CellId -> HCL mapping */
    console.log("CreateCellProxy() adding to hclMap", sCellId, hcl)
    if (this._hclMap[sCellId]) {
      this._hclMap[sCellId].push(hcl);
    } else {
      this._hclMap[sCellId] = [hcl];
    }
    console.log("createCellProxy() Currently stored hclMap:", this._hclMap);
    return cellProxy;
  }


  /** */
  dumpSignals(cellId?: CellId) {
    if (cellId) {
      const cellStr = CellIdStr(cellId);
      console.warn(`Dumping signal logs for cell "${this._hclMap[cellStr]}"`)
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
          return { timestamp: prettyDate(new Date(log[0])), cell: this._hclMap[log[1]], payload: log[2].data.payload}
        });
      console.table(logs);
    }
  }

  /** Log all signals received */
  private logSignal(signal: AppSignal): void {
    this._signalLogs.push([Date.now(), CellIdStr(signal.data.cellId), signal])
    console.log("signal logged", this._signalLogs)
  }



  /** */
  onSignal(signal: AppSignal): void {
    /** Grabe cell specific handlers */
    const hcls = this.getHcls(signal.data.cellId);
    const handlers = hcls? hcls.map((hcl) => this._signalHandlers[hcl]) : [];
    /** Grab common handler  */
    const allHandler = this._signalHandlers["__all"];
    if (allHandler) handlers.push(allHandler);
    /** Send to all handlers */
    for (const handler of handlers) {
      handler(signal);
    }
  }


  /** Store signalHandler to internal handler array */
  addSignalHandler(handler: AppSignalCb, hcl?: HCL): SignalUnsubscriber {
    hcl = hcl? hcl: "__all";
    console.log("addSignalHandler()", hcl, Object.keys(this._signalHandlers));
    //const maybeHandler = this._signalHandlers[cellIdStr]
    if (hcl != "__all") {
      const maybeHandler = Object.getOwnPropertyDescriptor(this._signalHandlers, hcl);
      if (maybeHandler && maybeHandler.value) {
        throw new Error(`SignalHandler already added for "${hcl}"`);
      }
    }
    this._signalHandlers[hcl] = handler;
    /* return tailored unsubscribe function to the caller */
    return {
      unsubscribe: () => {
        const maybeHandler = this._signalHandlers[hcl!]
        if (!maybeHandler) {
          console.warn("unsubscribe failed: Couldn't find signalHandler for", hcl)
          return;
        }
        delete this._signalHandlers[hcl!];
      }
    };
  }

}
