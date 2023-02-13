import {
  AppApi, AppInfoRequest, AppInfoResponse, AppSignal, AppSignalCb, AppWebsocket, CallZomeRequest, CellId,
  InstalledAppId,
  CreateCloneCellRequest, DisableCloneCellRequest, EnableCloneCellRequest, ClonedCell, CellType, ProvisionedCell,
} from "@holochain/client";
import { CellProxy } from "./CellProxy";
import {CellIdStr, RoleCellsMap, BaseRoleName, CellsForRole} from "./types";
import {areCellsEqual, Dictionary, prettyDate, printAppInfo} from "./utils";
import {HCL, HCLString} from "./hcl";
import {Cell} from "./cell";


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

  /** Signal log: [Timestamp, CellIdStr, Signal] */
  private _signalLogs: [number, CellIdStr, AppSignal][] = [];
  /** Map cells per App: InstalledAppId -> (BaseRoleName -> CellsForRole) */
  private _cellsByApp: Dictionary<RoleCellsMap> = {};
  /** Map cell locations: CellIdStr -> HCL[] */
  private _hclMap: Dictionary<HCL[]> = {};
  /** Store handlers per cell locaiton: HCLString -> AppSignalCb[] */
  private _signalHandlers: Dictionary<AppSignalCb[]> = {};
  /** Store cell proxies per cell: CellIdStr -> CellProxy */
  private _cellProxies: Dictionary<CellProxy> = {};


  /** -- Getters -- */

  /** */
  getAppCells(appId: InstalledAppId): RoleCellsMap | undefined {
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
    if (hcl.cloneId !== undefined) {
      cell = roleCells.clones[hcl.cloneId];
      if (!cell) {
        throw Error(`getCell() failed: clone "${hcl.cloneId}" not found for role "${hcl.toString()}"`);
      }
    }
    return new Cell(cell, hcl.appId, hcl.baseRoleName);
  }


  /** Get stored CellProxy or attempt to create it */
  getCellProxy(cellIdOrLoc: HCL | CellId): CellProxy {
    if (cellIdOrLoc instanceof HCL) {
      const cell = this.getCell(cellIdOrLoc);
      const maybeProxy = this.getCellProxy(cell.id);
      if (!maybeProxy) throw Error("getCellProxy() failed. Proxy not found for cell " + CellIdStr(cell.id));
      return maybeProxy;
    }
    const sId = CellIdStr(cellIdOrLoc);
    const maybeProxy = this._cellProxies[sId];
    if (maybeProxy === undefined) throw Error("getCellProxy() failed. Proxy not found for cell " + sId);
    return maybeProxy;
  }


  /** */
  getAppRoles(installedAppId: InstalledAppId): BaseRoleName[] | undefined {
    if (!this._cellsByApp[installedAppId]) return undefined;
    return Object.values(this._cellsByApp[installedAppId]).map((roleCells) => {
      return roleCells.provisioned.name;
    });
  }


  /** */
  getClones(appId: InstalledAppId, baseRoleName: BaseRoleName): ClonedCell[] {
    const maybeApp = this._cellsByApp[appId]
    if (!maybeApp) return [];
    const roleInstalledCells = maybeApp[baseRoleName];
    if (!roleInstalledCells) return [];
    return Object.values(roleInstalledCells.clones);
  }



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
        conductor._appWs = await AppWebsocket.connect(wsUrl, timeout);
        conductor._appWs.on('signal', (sig) => {conductor.onSignal(sig)})
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
      for (const [baseRoleName, cellInfo] of Object.entries(cellInfos)) {
        let cell: Cell;
        try {
          cell = Cell.from(cellInfo, appId, baseRoleName);
        } catch(e:any) {
          // skip stem cell
          continue;
        }
        if (areCellsEqual(cell.id, cellId)) {
          return cell;
        }
      }
    }
    Promise.reject("getCell() failed. Cell not found for app.")
  }


  /** Get all cells for a BaseRole in an app */
  async fetchCells(appId: InstalledAppId, baseRoleName: BaseRoleName): Promise<CellsForRole> {
    /** Make sure hApp exists */
    const appInfo = await this.appInfo({installed_app_id: appId});
    if (appInfo == null) {
      Promise.reject(`fetchCells() failed. App "${appId}" not found on AppWebsocket "${this._appWs.client.socket.url}"`)
    }
    console.log("fetchCells() installedAppInfo:\n", printAppInfo(appInfo));

    /** Make sure app Object exists */
    if (!this._cellsByApp[appId]) {
      this._cellsByApp[appId] = {};
    }
    /** Get all cells with that baseRoleName */
    let provisioned: ProvisionedCell | undefined;
    let clones: Dictionary<ClonedCell> = {};
    for (const [curBaseRoleName, cellInfos] of Object.entries(appInfo.cell_info)) {
      for (const cellInfo of Object.values(cellInfos)) {
        if (baseRoleName !== curBaseRoleName || CellType.Stem in cellInfo) {
          continue;
        }
        if (CellType.Cloned in cellInfo) {
          if (clones[cellInfo.cloned.clone_id]) {
            console.error(`fetchCells() Entry already exist for clone: "${cellInfo.cloned.clone_id}"`)
          }
          clones[cellInfo.cloned.clone_id] = cellInfo.cloned;
        } else {
          provisioned = cellInfo.provisioned;
        }
      }
    }
    if (typeof provisioned === 'undefined') {
      Promise.reject("Provisioned cell not found for role " + baseRoleName);
    }
    let roleInstalledCells: CellsForRole = {provisioned: provisioned!, clones}
    /** Store it*/
    this._cellsByApp[appId][baseRoleName] = roleInstalledCells;
    return roleInstalledCells;
  }


  /** */
  addClone(hcl: HCL, cloneCell: ClonedCell): void {
    if (!this._cellsByApp[hcl.appId]) throw Error("addClone() failed. no appId. " + hcl.toString());
    if (!this._cellsByApp[hcl.appId][hcl.baseRoleName]) throw Error("addClone() failed. no baseRoleName. " + hcl.toString());
    if (hcl.cloneId === undefined) throw Error("addClone() failed. Cell is not a CloneCell: " + hcl.toString());

    // let cloneName = hcl.cloneId;
    // if (hcl.cloneId === undefined) {
    //   const cloneIndex: number = Object.keys(this._cellsByApp[hcl.appId][hcl.baseRoleName].clones).length;
    //   cloneName = createCloneName(hcl.baseRoleName, cloneIndex);
    // }
    this._cellsByApp[hcl.appId][hcl.baseRoleName].clones[cloneCell.clone_id!] = cloneCell;
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
    console.log("createCellProxy() for", hcl.toString());
    /** Make sure cell exists */
    const cell = this.getCell(hcl);
    const sCellId = CellIdStr(cell.id);
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
    const hcls = this.getLocations(signal.cell_id);
    const handlerss: AppSignalCb[][]  = hcls? hcls.map((hcl) => this._signalHandlers[hcl.toString()]) : [];
    console.log("onSignal()", hcls.toString(), handlerss);
    /** Grab common handler  */
    const allHandlers = this._signalHandlers["__all"];
    if (allHandlers) handlerss.push(allHandlers);
    /** Send to all handlers */
    for (const handlers of handlerss) {
      for (const handler of handlers) {
        handler(signal);
      }
    }
  }


  /** Store signalHandler to internal handler array */
  addSignalHandler(handler: AppSignalCb, hcl?: HCLString): SignalUnsubscriber {
    console.log("addSignalHandler()", hcl);

    hcl = hcl? hcl: "__all";
    //console.log("addSignalHandler()", hcl, Object.keys(this._signalHandlers));
    if (!this._signalHandlers[hcl]) {
      this._signalHandlers[hcl] = [handler];
    } else {
      this._signalHandlers[hcl].push(handler);
    }
    /* return tailored unsubscribe function to the caller */
    return {
      unsubscribe: () => {
      // FIXME
      //   const maybeHandler = this._signalHandlers[hcl!]
      //   if (!maybeHandler) {
      //     console.warn("unsubscribe failed: Couldn't find signalHandler for", hcl)
      //     return;
      //   }
      //   delete this._signalHandlers[hcl!];
      }
    };
  }

  /** Log all signals received */
  private logSignal(signal: AppSignal): void {
    this._signalLogs.push([Date.now(), CellIdStr(signal.cell_id), signal])
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
          return { timestamp: prettyDate(new Date(log[0])), zome: log[2].zome_name, payload: log[2].payload}
        });
      console.table(logs);
    } else {
      console.warn("Dumping all signal logs", )
      const logs = this._signalLogs
        .map((log) => {
          const app = this._hclMap[log[1]][0].appId
          const cell: string = this._hclMap[log[1]][0].roleName;
          return { timestamp: prettyDate(new Date(log[0])), app, cell, zome: log[2].zome_name, payload: log[2].payload}
        });
      console.table(logs);
    }
  }
}
