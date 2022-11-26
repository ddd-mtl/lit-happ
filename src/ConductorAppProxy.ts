import { AppApi, AppInfoRequest, AppInfoResponse, AppSignal, AppSignalCb, AppWebsocket, CallZomeRequest, CellId, DnaDefinition, InstalledAppId, InstalledAppInfo, RoleId } from "@holochain/client";
import { CellProxy } from "./CellProxy";
import {HappDef, HappViewModel} from "./HappViewModel";
import { ReactiveElement } from "lit";
import { MyDnaDef } from "./CellDef";
import { Role } from "@holochain/client/lib/hdk/countersigning";

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
  async newHappViewModel(host: ReactiveElement, happDef: HappDef): Promise<HappViewModel> {
    try {
      const appInfo = await this._appWs.appInfo({ installed_app_id: happDef.id })
      if (!appInfo.status.hasOwnProperty("running")) {
        return Promise.reject(`HappViewModel initialization failed: hApp ${happDef.id} is not running`);
      }
      return new HappViewModel(host, appInfo, this, happDef.dvmDefs);
    } catch (e) {
      console.error("HappViewModel initialization failed", e)
      return Promise.reject("HappViewModel initialization failed");
    }
  }


  /** Factory for doing all the async stuff */
  newCellProxy(appInfo: InstalledAppInfo, roleId: RoleId/*, dnaDef: DnaDefinition*/): CellProxy {
    //console.log({cellData:  appInfo.cell_data});
    for (const installedCell of appInfo.cell_data) {
      if (installedCell.role_id == roleId) {
        //const myDnaDef = new MyDnaDef(dnaDef);
        return new CellProxy(this, installedCell, /*myDnaDef,*/ this.defaultTimeout);
      }
    }
    throw Error(`CellProxy initialization failed: No cell with RoleId "${roleId}" found.`);
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
