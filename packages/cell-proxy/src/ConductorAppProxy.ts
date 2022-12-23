import {
  AppApi, AppInfoRequest, AppInfoResponse, AppSignal, AppSignalCb, AppWebsocket, CallZomeRequest, CellId,
  InstalledAppId, InstalledCell,
  CreateCloneCellRequest, DisableCloneCellRequest, EnableCloneCellRequest, Cell,
} from "@holochain/client";
import { CellProxy } from "./CellProxy";
import {CellIdStr, destructureRoleInstanceId, CellsMap, BaseRoleName, RoleInstanceId, RoleCells} from "./types";
import {areCellsEqual, Dictionary, intoCell, prettyDate} from "./utils";
import {HCL, HCLString} from "./hcl";
import {AppInfo} from "@holochain/client/lib/api/admin";


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
  private _cellsByApp: Dictionary<CellsMap> = {};
  /** CellIdStr -> HCL[] */
  private _hclMap: Dictionary<HCL[]> = {};
  /** HCLString -> AppSignalCb */
  private _signalHandlers: Dictionary<AppSignalCb> = {};
  /** CellIdStr -> CellProxy */
  private _cellProxies: Dictionary<CellProxy> = {};


  /** -- Getters -- */

  /** */
  getAppCells(appId: InstalledAppId): CellsMap | undefined {
    return this._cellsByApp[appId];
  }

  /** */
  getLocations(cellId: CellId): HCL[] | undefined {
    return this._hclMap[CellIdStr(cellId)];
  }

  /** */
  getCell(hcl: HCL): Cell {
    const roleCellsMap = this._cellsByApp[hcl.appId];
    if (!roleCellsMap) throw Error(`getCell() failed. No hApp with ID "${hcl.appId}" found.`);
    const roleCells = roleCellsMap[hcl.baseRoleName];
    if (!roleCells) throw Error(`getCell() failed: BaseRoleName "${hcl.baseRoleName}" not found in happ "${hcl.appId}"`);
    let cell = roleCells.provisioned;
    if (hcl.cloneName !== undefined) {
      cell = roleCells.clones[hcl.cloneName];
      if (!cell) {
        throw Error(`getCell() failed: clone "${hcl.cloneName}" not found for role "${hcl.appId}/${hcl.baseRoleName}"`);
      }
    } else {
      if (hcl.cloneIndex !== undefined) {
        cell = roleCells.clones[String(hcl.cloneIndex)];
        if (!cell) {
          throw Error(`getCell() failed: clone "${hcl.cloneIndex}" not found for role "${hcl.appId}/${hcl.baseRoleName}"`);
        }
      }
    }
    return cell;
  }


  /** Get stored CellProxy or attempt to create it */
  getCellProxy(cellIdOrLoc: HCL | CellId): CellProxy {
    if (cellIdOrLoc instanceof HCL) {
      const installedCell = this.getCell(cellIdOrLoc);
      const maybeProxy = this.getCellProxy(installedCell.cell_id);
      if (!maybeProxy) throw Error("getCellProxy() failed. Proxy not found for cell " + CellIdStr(installedCell.cell_id));
      return maybeProxy;
    }
    const sId = CellIdStr(cellIdOrLoc);
    const maybeProxy = this._cellProxies[sId];
    if (maybeProxy === undefined) throw Error("getCellProxy() failed. Proxy not found for cell " + sId);
    return maybeProxy;
  }


  /** */
  getAppRoleInstanceIds(installedAppId: InstalledAppId): RoleInstanceId[] | undefined {
    if (!this._cellsByApp[installedAppId]) return undefined;
    return Object.values(this._cellsByApp[installedAppId]).map((roleCells) => {
      return roleCells.provisioned.name;
    });
  }


  /** */
  getClones(appId: InstalledAppId, baseRoleName: BaseRoleName): Cell[] {
    const maybeApp = this._cellsByApp[appId]
    if (!maybeApp) return [];
    const roleInstalledCells = maybeApp[baseRoleName];
    if (!roleInstalledCells) return [];
    return Object.values(roleInstalledCells.clones);
  }



  async createCloneCell(request: CreateCloneCellRequest): Promise<InstalledCell> {
    //console.log("createCloneCell() called:", request)
    return this._appWs!.createCloneCell(request);
  }

  /** -- AppApi (Passthrough to appWebsocket) -- */

  async enableCloneCell(request: EnableCloneCellRequest): Promise<InstalledCell> {
    //console.log("enableCloneCell() called:", request)
    return this._appWs!.enableCloneCell(request);
  }

  async disableCloneCell(request: DisableCloneCellRequest): Promise<void> {
    //console.log("disableCloneCell() called:", request)
    this._appWs!.disableCloneCell(request);
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
    const _unsub = this.addSignalHandler((sig) => this.logSignal(sig));
  }



  /** -- Methods -- */

  /** */
  async fetchCell(appId: InstalledAppId, cellId: CellId): Promise<Cell> {
    const appInfo = await this.appInfo({installed_app_id: appId});
    //console.log("fetchCell", appInfo);
    if (appInfo == null) {
      Promise.reject(`getCell() failed. App "${appId}" not found on AppWebsocket "${this._appWs.client.socket.url}"`)
    }
    for (const cellInfos of Object.values(appInfo.cell_info)) {
      for (const cellInfo of Object.values(cellInfos)) {
        const cell = intoCell(cellInfo);
        if (cell === undefined) {
          continue;
        }
        if (areCellsEqual(cell.cell_id, cellId)) {
          return cell;
        }
      }
    }
    Promise.reject("getCell() failed. Cell not found for app.")
  }

  /** */
  async fetchCells(appId: InstalledAppId, baseRoleName: BaseRoleName): Promise<RoleCells> {
    /** Make sure hApp exists */
    const appInfo = await this.appInfo({installed_app_id: appId});
    if (appInfo == null) {
      Promise.reject(`fetchCells() failed. App "${appId}" not found on AppWebsocket "${this._appWs.client.socket.url}"`)
    }
    //console.log("fetchCells() installedAppInfo:\n", printAppInfo(installedAppInfo));
    /** Make sure app Object exists */
    if (!this._cellsByApp[appId]) {
      this._cellsByApp[appId] = {};
    }
    /** Get all cells with that baseRoleName */
    let provisioned: Cell | undefined;
    let clones: Dictionary<Cell> = {};
    for (const [roleName, cellInfos] of Object.entries(appInfo.cell_info)) {
      for (const cellInfo of Object.values(cellInfos)) {
        const cell = intoCell(cellInfo);
        if (cell === undefined) {
          continue;
        }
        //console.log(`CreateCellProxy(): Found cell "${installedCell.role_id}":`, CellIdStr(installedCell.cell_id));
        const maybePair = destructureRoleInstanceId(roleName);
        const curBaseName = maybePair ? maybePair[0] : roleName;
        if (curBaseName !== baseRoleName) {
          continue;
        }
        if (maybePair) {
          if (clones["" + maybePair[1]]) {
            console.error(`fetchCells() Proxy already exist for clone: "${maybePair[0]}/${maybePair[1]}"`)
          }
          clones["" + maybePair[1]] = cell;
        } else {
          provisioned = cell;
        }
      }
    }
    if (typeof provisioned === 'undefined') {
      Promise.reject("Provisioned cell not found for role " + baseRoleName);
    }
    let roleInstalledCells: RoleCells = {provisioned: provisioned!, clones}
    /** Store it*/
    this._cellsByApp[appId][baseRoleName] = roleInstalledCells;
    return roleInstalledCells;
  }


  /** */
  addClone(hcl: HCL, cloneCell: Cell): void {
    if (!this._cellsByApp[hcl.appId]) throw Error("addCloneInstalledCell() failed. no appId. " + hcl.toString());
    if (!this._cellsByApp[hcl.appId][hcl.baseRoleName]) throw Error("addCloneInstalledCell() failed. no baseRoleName. " + hcl.toString());
    if (hcl.cloneName !== undefined) {
      this._cellsByApp[hcl.appId][hcl.baseRoleName].clones[hcl.cloneName] = cloneCell;
      return;
    }
    if (hcl.cloneIndex === undefined) throw Error("addCloneInstalledCell() failed. Missing cloneIndex " + hcl.toString());
    this._cellsByApp[hcl.appId][hcl.baseRoleName].clones[String(hcl.cloneIndex)] = cloneCell;
    // const sCellId = CellIdStr(cloneCell.cell_id);
    // console.log("CreateCellProxy() adding to hclMap", sCellId, cellLoc.asHcl())
    // if (this._hclMap[sCellId]) {
    //   this._hclMap[sCellId].push(cellLoc.asHcl());
    // } else {
    //   this._hclMap[sCellId] = [cellLoc.asHcl()];
    // }
  }


  /** */
  createCellProxy(hcl: HCL): CellProxy {
    //console.log("createCellProxy() for", hcl.toString());
    /** Make sure cell exists */
    const cell = this.getCell(hcl);
    const sCellId = CellIdStr(cell.cell_id);
    /** Create proxy for this cell if none exist yet, otherwise reuse */
    let cellProxy = this._cellProxies[sCellId];
    if (!cellProxy) {
      /** Create and store Proxy */
      cellProxy = new CellProxy(this, cell, this.defaultTimeout);
      this._cellProxies[sCellId] = cellProxy;
    }
    /** Create CellId -> HCL mapping */
    //console.log("CreateCellProxy() adding to hclMap", sCellId, hcl.toString())
    if (this._hclMap[sCellId]) {
      this._hclMap[sCellId].push(hcl);
    } else {
      this._hclMap[sCellId] = [hcl];
    }
    //console.log("createCellProxy() Currently stored hclMap:", this._hclMap);
    /** Done */
    return cellProxy;
  }


  /** */
  onSignal(signal: AppSignal): void {
    /** Grabe cell specific handlers */
    const hcls = this.getLocations(signal.data.cellId);
    const handlers = hcls? hcls.map((hcl) => this._signalHandlers[hcl.toString()]) : [];
    /** Grab common handler  */
    const allHandler = this._signalHandlers["__all"];
    if (allHandler) handlers.push(allHandler);
    /** Send to all handlers */
    for (const handler of handlers) {
      handler(signal);
    }
  }


  /** Store signalHandler to internal handler array */
  addSignalHandler(handler: AppSignalCb, hcl?: HCLString): SignalUnsubscriber {
    hcl = hcl? hcl: "__all";
    //console.log("addSignalHandler()", hcl, Object.keys(this._signalHandlers));
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

  /** Log all signals received */
  private logSignal(signal: AppSignal): void {
    this._signalLogs.push([Date.now(), CellIdStr(signal.data.cellId), signal])
    //console.log("signal logged", this._signalLogs)
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
}
