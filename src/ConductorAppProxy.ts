import { AppApi, AppInfoRequest, AppInfoResponse, AppSignal, AppSignalCb, AppWebsocket, CallZomeRequest, CellId, DnaDefinition, InstalledAppId, InstalledAppInfo, InstalledCell, RoleId } from "@holochain/client";
import { CellProxy } from "./CellProxy";
import {HappDef, HappViewModel} from "./HappViewModel";
import { ReactiveElement } from "lit";
import { MyDnaDef } from "./CellDef";
import { Role } from "@holochain/client/lib/hdk/countersigning";
import { Dictionary } from "@holochain-open-dev/core-types";

/** From hc-client-js API */
export interface SignalUnsubscriber {
  unsubscribe: () => void;
}


/**
 * Creates, connects and holds a appWebsocket.
 * Factory for Dna and Zome proxies that uses this appWebsocket.
 * TODO Implement Singleton per port?
 */
export class ConductorAppProxy implements AppApi {

  /** InstalledAppId -> [RoleId]*/
  private _installedHapps: Dictionary<Array<InstalledCell>> = {}

  /** CellDef -> CellProxy */
  private _cellProxies: Dictionary<CellProxy> = {}

  /** */
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

  /** -- Proxy Pattern -- */
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
        conductor._appWs = await AppWebsocket.connect(wsUrl, timeout, conductor.onSignal)
        return conductor;
      } catch (e) {
        console.error("ConductorAppProxy initialization failed", e)
        return Promise.reject("ConductorAppProxy initialization failed");
      }
    }
  }

  private static async fromSocket(appWebsocket: AppWebsocket): Promise<ConductorAppProxy> {
    try {
      let conductor = new ConductorAppProxy(appWebsocket.defaultTimeout);
      conductor._appWs = appWebsocket;
      return conductor;
    } catch (e) {
      console.error("ConductorAppProxy initialization failed", e)
      return Promise.reject("ConductorAppProxy initialization failed");
    }
  }

  /** Ctor */
  private constructor(public defaultTimeout: number) {
    //const _unsubscribe = _appWs.addSignalHandler(this.onSignal);
    const _unsub = this.addSignalHandler(this.logSignal);
  }


  /** -- Fields -- */
  private _appWs!: AppWebsocket;

  private _signalHandlers: AppSignalCb[] = []
  private _signalLogs: [number, AppSignal][] = [];


  /** -- Methods -- */

  /** Spawn a HappViewModel for an AppId running on the ConductorAppProxy */
  async createHvm(host: ReactiveElement, happDef: HappDef): Promise<HappViewModel> {
    await this.createCellProxies(happDef);
    return new HappViewModel(host, this, happDef);
  }


  /** Get stored CellProxy or attempt to create it */
   getCellProxy(installedAppId: InstalledAppId, roleId: RoleId): CellProxy {
    const cellDef = "" + installedAppId + "/" + roleId;
    let maybeProxy = this._cellProxies[cellDef];
    if (!maybeProxy) {
      throw Error(`getCellProxy() failed: No Cell found for RoleId "${roleId}" in happ ${installedAppId}`);
    }
    return maybeProxy;
  }


  /** */
  async createCellProxy(installedAppId: InstalledAppId, roleId: RoleId): Promise<void> {
    const cellDef = "" + installedAppId + "/" + roleId;
    let maybeProxy = this._cellProxies[cellDef];
    if (maybeProxy) {
      console.warn("Cell already created", cellDef);
      return;
    }
    const installedAppInfo = await this.appInfo({installed_app_id: installedAppId});
    this._installedHapps[installedAppId] = installedAppInfo.cell_data;
    const installedCell = this.getInstalledCell(installedAppId, roleId);
    const cellProxy = new CellProxy(this, installedCell, this.defaultTimeout);
    this._cellProxies[cellDef] = cellProxy;
  }

  private async createCellProxies(happDef: HappDef): Promise<void> {
    for (const dvmDef of happDef.dvmDefs) {
      let roleId;
      if (Array.isArray(dvmDef)) {
        roleId = dvmDef[1];
      } else {
        roleId = dvmDef.DEFAULT_ROLE_ID;
        //roleId = (dvmDef.constructor as any).DEFAULT_ROLE_ID;
      }
      await this.createCellProxy(happDef.id, roleId);
    }
  }

  /** */
  private onSignal(signal: AppSignal): void {
    for (const handler of this._signalHandlers) {
      handler(signal)
    }
  }


  /** Log all signals received */
  private logSignal(signal: AppSignal): void {
    this._signalLogs.push([Date.now(), signal])
  }


  /** Store signalHandler to internal handler array */
  addSignalHandler(handler: AppSignalCb): SignalUnsubscriber {
    const index = this._signalHandlers.indexOf(handler);
    if (index >= 0) {
      throw new Error("SignalHandler already added to this CellProxy");
    }
    this._signalHandlers.push(handler);
    /* return tailored unsubscribe function to the caller */
    return {
      unsubscribe: () => {
        const index = this._signalHandlers.indexOf(handler);
        if (index <= -1) {
          console.warn("unsubscribe failed: Couldn't find signalHandler in CellProxy")
          return;
        }
        this._signalHandlers.slice(index, 1)
      }
    };
  }

}
