import { AppSignal, AppSignalCb, AppWebsocket, CallZomeRequest, CellId, InstalledAppId, InstalledAppInfo } from "@holochain/client";
import { serializeHash } from "@holochain-open-dev/utils";
import { AgentPubKeyB64, DnaHashB64 } from "@holochain-open-dev/core-types";
import { anyToB64 } from "./utils";
import { DnaProxy } from "./DnaProxy";
import { HappController } from "./HappController";
import { ReactiveElement } from "lit";


/** From hc-client-js API */
export interface SignalUnsubscriber {
  unsubscribe: () => void;
}


/**
 * Creates, connects and holds a appWebsocket.
 * Factory for Dna and Zome proxies that uses this appWebsocket.
 * TODO Implement Singleton per port?
 */
export class ConductorAppProxy {

  // cloneCell
  // archiveCell

  /** Factory for doing all the async stuff */
  static async new(port: number, defaultTimeout?: number): Promise<ConductorAppProxy> {
    const wsUrl = `ws://localhost:${port}`
    const timeout = defaultTimeout ? defaultTimeout : 10 * 1000;
    try {
      let conductor = new ConductorAppProxy(port, timeout);
      const appWebsocket = await AppWebsocket.connect(wsUrl, timeout, conductor.onSignal)
      conductor._appWs = appWebsocket;
      return conductor;
    } catch (e) {
      console.error("ConductorAppService initialization failed", e)
      return Promise.reject("ConductorAppService initialization failed");
    }
  }

  /** Ctor */
  private constructor(public readonly port: number, public defaultTimeout: number) {
    //const _unsubscribe = _appWs.addSignalHandler(this.onSignal);
    const _unsub = this.addSignalHandler(this.logSignal);
  }


  /** -- Fields -- */
  private _appWs!: AppWebsocket;

  private _signalHandlers: AppSignalCb[] = []
  private _signalLogs: [number, AppSignal][] = [];


  /** -- Methods -- */

  /** Spawn a HappElement for an AppId running on the ConductorAppProxy */
  async newHappElement(host: ReactiveElement, installedAppId: InstalledAppId): Promise<HappController> {
    try {
      const appInfo = await this._appWs.appInfo({ installed_app_id: installedAppId })
      if (!appInfo.status.hasOwnProperty("running")) {
        return Promise.reject(`HappElement initialization failed: hApp ${installedAppId} is not running`);
      }
      return new HappController(host, appInfo, this);
    } catch (e) {
      console.error("HappElement initialization failed", e)
      return Promise.reject("HappElement initialization failed");
    }
  }


  /** Factory for doing all the async stuff */
  async newDnaProxy(installedAppId: string, roleId: string): Promise<DnaProxy> {
    try {
      const appInfo = await this._appWs.appInfo({ installed_app_id: installedAppId });
      for (const installedCell of appInfo.cell_data) {
        if (installedCell.role_id == roleId) {
          return new DnaProxy(this, installedCell, this.defaultTimeout);
        }
      }
      return Promise.reject(`DnaService initialization failed: No cell with RoleId "${roleId}" found.`);
    } catch (e) {
      console.error("DnaService initialization failed", e)
      return Promise.reject("DnaService initialization failed");
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
      throw new Error("SignalHandler already added to this DnaClient");
    }
    this._signalHandlers.push(handler);
    /* return tailored unsubscribe function to the caller */
    return {
      unsubscribe: () => {
        const index = this._signalHandlers.indexOf(handler);
        if (index <= -1) {
          console.warn("unsubscribe failed: Couldn't find signalHandler in DnaClient")
          return;
        }
        this._signalHandlers.slice(index, 1)
      }
    };
  }


  /** Passthrough with default timeout */
  async callZome(req: CallZomeRequest, timeout?: number): Promise<any> {
    timeout = timeout? timeout : this.defaultTimeout
    return this._appWs.callZome(req, timeout)
  }

}  