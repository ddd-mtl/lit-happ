import {
  AdminWebsocket,
  AppClient,
  AppEvents,
  AppInfoResponse,
  AppNetworkInfoRequest,
  AppSignal,
  AppSignalCb,
  CallZomeRequest,
  CellId,
  CellType,
  ClonedCell,
  CreateCloneCellRequest,
  DisableCloneCellRequest,
  EnableCloneCellRequest,
  encodeHashToBase64,
  InstalledAppId,
  NetworkInfo,
  NetworkInfoResponse,
  ProvisionedCell,
  Timestamp, ZomeName,
} from "@holochain/client";
import {UnsubscribeFunction} from "emittery";
import {CellProxy} from "./CellProxy";
import {
  BaseRoleName,
  CellIdStr,
  CellsForRole,
  LitHappSignal,
  RoleCellsMap,
  SignalPayload,
  SignalType,
  SystemSignal
} from "./types";
import {areCellsEqual, Dictionary, prettyDate, printAppInfo} from "./utils";
import {HCL, HCLString} from "./hcl";
import {Cell} from "./cell";
import {AgentPubKey} from "@holochain/client/lib/types";


/** */
export interface SignalUnsubscriber {
  unsubscribe: () => void;
}


export interface SignalLog {
  ts: Timestamp,
  cellId: CellIdStr,
  zome_name: string,
  type: SignalType,
  payload: SignalPayload,
}

/**
 * Creates and holds Cell proxies.
 * Maintains a mapping between CellIds and HCLs
 * Handles SignalHandlers per HCL
 * Stores appSignal logs
 * TODO Implement Singleton per App port?
 */
export class AppProxy implements AppClient {

  /** -- Fields -- */

  public defaultTimeout: number;
  public adminWs?: AdminWebsocket;

  /** Signal logs */
  private _signalLogs: SignalLog[] = [];
  /** Map cells per App: InstalledAppId -> (BaseRoleName -> CellsForRole) */
  private _cellsByApp: Dictionary<RoleCellsMap> = {};
  /** Map cell locations: CellIdStr -> HCL[] */
  private _hclMap: Dictionary<HCL[]> = {};
  /** Store handlers per cell location: HCLString -> AppSignalCb[] */
  private _signalHandlers: Dictionary<AppSignalCb[]> = {};
  /** Store cell proxies per cell: CellIdStr -> CellProxy */
  private _cellProxies: Dictionary<CellProxy> = {};


  /** Map HCLString: CloneId -> CloneName */
  private _cellNames: Dictionary<string> = {} // Provisioned cell's name is its baseRoleName so no need to map them

  /** -- Getters -- */

  /** Check this after connecting since AppWebsocket can shamelessly override the provided args. */
  get appIdOfShame(): InstalledAppId | undefined { return undefined }

  /** */
  getAppCells(appId: InstalledAppId): RoleCellsMap | undefined {
    return this._cellsByApp[appId];
  }

  /** */
  getCellName(hcl: HCL): string {return this._cellNames[hcl.toString()]}


  get signalLogs(): SignalLog[]  { return this._signalLogs }

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


  /** -- AppClient -- */

  myPubKey: AgentPubKey;
  installedAppId: InstalledAppId;

  async callZome(req: CallZomeRequest, timeout?: number): Promise<unknown> {
    throw new Error("Method not implemented.");
  }

  on<Name extends keyof AppEvents>(
    eventName: Name | readonly Name[],
    listener: AppSignalCb
  ): UnsubscribeFunction {
    throw new Error("Method not implemented.");
  }

  async appInfo(): Promise<AppInfoResponse> {
    throw new Error("Method not implemented.");
  }

  async createCloneCell(request: CreateCloneCellRequest): Promise<ClonedCell> {
    throw new Error("Method not implemented.");
  }

  async enableCloneCell(request: EnableCloneCellRequest): Promise<ClonedCell> {
    throw new Error("Method not implemented.");
  }

  async disableCloneCell(request: DisableCloneCellRequest): Promise<void> {
    throw new Error("Method not implemented.");
  }

  networkInfo(args: AppNetworkInfoRequest): Promise<NetworkInfoResponse> {
    throw new Error("Method not implemented.");
  }


  /** -- Creation -- */

  /** Ctor */
  /*protected*/ constructor(defaultTimeout: number, appId: InstalledAppId, agentId: AgentPubKey, adminWs?: AdminWebsocket) {
    this.defaultTimeout = defaultTimeout;
    this.adminWs = adminWs;
    this.installedAppId = appId;
    this.myPubKey = agentId;
    /*const _unsub =*/ this.addSignalHandler((sig) => this.logSignal(sig));
  }


  /** -- Methods -- */

  get networkInfoLogs(): Record<CellIdStr, [Timestamp, NetworkInfo][]> {return {}}

  /** */
  async fetchCell(appId: InstalledAppId, cellId: CellId): Promise<Cell> {
    const appInfo = await this.appInfo();
    //console.log("fetchCell", appInfo);
    if (appInfo == null) {
      return Promise.reject(`getCell() failed. App "${appId}" not found"`);
    }
    for (const cellInfos of Object.values(appInfo.cell_info)) {
      for (const [baseRoleName, cellInfo] of Object.entries(cellInfos)) {
        let cell: Cell;
        try {
          cell = Cell.from(cellInfo, appId, baseRoleName);
        } catch(e) {
          // skip stem cell
          continue;
        }
        if (areCellsEqual(cell.id, cellId)) {
          return cell;
        }
      }
    }
    return Promise.reject("getCell() failed. Cell not found for app.");
  }


  /** Get all cells for a BaseRole in an app */
  async fetchCells(appId: InstalledAppId, baseRoleName: BaseRoleName): Promise<CellsForRole> {
    /** Make sure hApp exists */
    const appInfo = await this.appInfo();
    if (appInfo == null) {
      return Promise.reject(`fetchCells() failed. App "${appId}" not found`);
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
      return Promise.reject("Provisioned cell not found for role " + baseRoleName);
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
    this._cellsByApp[hcl.appId][hcl.baseRoleName].clones[cloneCell.clone_id] = cloneCell;
    // const sCellId = CellIdStr(cloneCell.cell_id);
    // console.log("CreateCellProxy() adding to hclMap", sCellId, cellLoc.asHcl())
    // if (this._hclMap[sCellId]) {
    //   this._hclMap[sCellId].push(cellLoc.asHcl());
    // } else {
    //   this._hclMap[sCellId] = [cellLoc.asHcl()];
    // }
  }


  /** */
  createCellProxy(hcl: HCL, cloneName?: string): CellProxy {
    console.log("createCellProxy() for", hcl.toString(), cloneName);
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
    /** Associate cloneName if any */
    const name = cloneName?  cloneName : hcl.baseRoleName;
    this._cellNames[hcl.toString()] = name;
    /** Done */
    return cellProxy;
  }


  /** */
  onSignal(signal: AppSignal): void {
    /** Grab cell specific handlers */
    const hcls = this.getLocations(signal.cell_id);
    const handlerss: AppSignalCb[][]  = hcls? hcls.map((hcl) => this._signalHandlers[hcl.toString()]) : [];
    //console.log("onSignal()", hcls? hcls.toString() : "unknown cell: " + encodeHashToBase64(signal.cell_id[0]), handlerss);
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
    //console.log("addSignalHandler()", hcl);

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
  protected logSignal(signal: AppSignal): void {
    const [signalType, payload] = this.determineSignalType(signal);
    //console.log("signal logged", signal, isSystem)
    this._signalLogs.push({ts: Date.now(), cellId: CellIdStr(signal.cell_id), zome_name: signal.zome_name, payload, type: signalType})
  }


  /** */
  determineSignalType(appSignal: AppSignal): [SignalType, unknown | SystemSignal | LitHappSignal] {
    if (typeof appSignal.payload !== 'object' || Array.isArray(appSignal.payload) || appSignal.payload === null) {
      return [SignalType.Unknown, appSignal.payload];
    }
    const payload = appSignal.payload as Object;
    if ("pulses" in payload && "from" in payload) {
      return [SignalType.LitHapp, appSignal.payload as LitHappSignal];
    }
    if ("System" in payload) {
      return  [SignalType.System, appSignal.payload as SystemSignal];
    }
    return [SignalType.Unknown, appSignal.payload];
  }


  /** */
  dumpSignalLogs(canAppSignals: boolean, cellId?: CellId, zomeName?: ZomeName) {
    const me = encodeHashToBase64(this.myPubKey);
    let signals = this._signalLogs;
    /** Filter by cell and zome */
    let cellNames;
    if (cellId) {
      const cellStr = CellIdStr(cellId);
      const hcls = this._hclMap[cellStr];
      cellNames = hcls.map((hcl) => this.getCellName(hcl));
      signals = this._signalLogs
        .filter((log) => log.cellId == cellStr);
      if (zomeName) {
        signals = this._signalLogs
          .filter((log) => log.zome_name == zomeName);
      }
    }
    /** Seperate by type */
    const unknownSignals = signals.filter((log) => log.type == SignalType.Unknown);
    const sysSignals = signals.filter((log) => log.type == SignalType.System);
    const appSignals = signals.filter((log) => log.type == SignalType.LitHapp);

    /** Dump unknown signals */
    if (unknownSignals.length) {
      let logs;
      if (zomeName) {
        console.error(`Unknown signals from zome "${zomeName}": ${unknownSignals.length}`);
        logs = unknownSignals
          .map((log) => {
            return {timestamp: prettyDate(new Date(log.ts)), payload: log.payload}
          });
      } else {
        console.error(`Unknown signals: ${unknownSignals.length}`);
        logs = unknownSignals
          .map((log) => {
            return {timestamp: prettyDate(new Date(log.ts)), zome: log.zome_name, payload: log.payload}
          });
      }
      console.table(logs);
    }

    /** Dump System signals */
    let syslogs;
    if (cellNames) {
      if (zomeName) {
        console.warn(`Unknown signals from zome "${zomeName}" in cell "${cellNames}"`);
        syslogs = sysSignals.map((log) => {
            const payload = (log.payload as SystemSignal).System;
            return {timestamp: prettyDate(new Date(log.ts)), payload}
          });
      } else {
        console.warn(`System signals from cell "${cellNames}"`);
        syslogs = sysSignals.map((log) => {
            const payload = (log.payload as SystemSignal).System;
            return {timestamp: prettyDate(new Date(log.ts)), zome: log.zome_name, payload}
          });
      }
    } else {
      console.warn(`System signals: ${sysSignals.length}`)
      syslogs = sysSignals.map((log) => {
          const app = this._hclMap[log.cellId][0].appId;
          const cell: string = this._hclMap[log.cellId][0].roleName;
          const payload = (log.payload as SystemSignal).System;
          return {timestamp: prettyDate(new Date(log.ts)), app, cell, zome: log.zome_name, payload};
        });
    }
    console.table(syslogs);

    /** Dump App signals */
    if (!canAppSignals) {
      return;
    }
    let appLogs;
    if (cellNames) {
      if (zomeName) {
        console.warn(`App signals from zome "${zomeName}" in cell "${cellNames}"`);
        appLogs = appSignals.map((log) => {
          const payload = log.payload as LitHappSignal;
          const from = encodeHashToBase64(payload.from) == me ? "self" : encodeHashToBase64(payload.from);
          return {timestamp: prettyDate(new Date(log.ts)), from, count: payload.pulses.length, payload: payload.pulses}
        });
      } else {
        console.warn(`App signals from cell "${cellNames}"`);
        appLogs = appSignals.map((log) => {
          const payload = log.payload as LitHappSignal;
          const from = encodeHashToBase64(payload.from) == me ? "self" : encodeHashToBase64(payload.from);
          return {timestamp: prettyDate(new Date(log.ts)), zome: log.zome_name, from, count: payload.pulses.length, payload: payload.pulses}
        });
      }
    } else {
      console.warn(`App signals: ${appSignals.length}`)
      appLogs = appSignals.map((log) => {
          const app = this._hclMap[log.cellId][0].appId;
          const cell: string = this._hclMap[log.cellId][0].roleName;
          const signal = log.payload as LitHappSignal;
          const from = encodeHashToBase64(signal.from) == me? "self" : encodeHashToBase64(signal.from);
          return { timestamp: prettyDate(new Date(log.ts)), app, cell, zome: log.zome_name, from, count: signal.pulses.length, payload: signal.pulses};
        });
    }
    console.table(appLogs);
  }
}


/** Protocol for notifying the ViewModel (UI) of system level events */
export type SystemSignalProtocolVariantPostCommitNewStart = {
  type: "PostCommitNewStart"
  app_entry_type: string
}
export type SystemSignalProtocolVariantPostCommitNewEnd = {
  type: "PostCommitNewEnd"
  app_entry_type: string
  succeeded: boolean
}
export type SystemSignalProtocolVariantPostCommitDeleteStart = {
  type: "PostCommitDeleteStart"
  app_entry_type: string
}
export type SystemSignalProtocolVariantPostCommitDeleteEnd = {
  type: "PostCommitDeleteEnd"
  app_entry_type: string
  succeeded: boolean
}
export type SystemSignalProtocolVariantSelfCallStart = {
  type: "SelfCallStart"
  zome_name: string
  fn_name: string
}
export type SystemSignalProtocolVariantSelfCallEnd = {
  type: "SelfCallEnd"
  zome_name: string
  fn_name: string
  succeeded: boolean
}
export type SystemSignalProtocol =
  | SystemSignalProtocolVariantPostCommitNewStart
  | SystemSignalProtocolVariantPostCommitNewEnd
  | SystemSignalProtocolVariantPostCommitDeleteStart
  | SystemSignalProtocolVariantPostCommitDeleteEnd
  | SystemSignalProtocolVariantSelfCallStart
  | SystemSignalProtocolVariantSelfCallEnd;
