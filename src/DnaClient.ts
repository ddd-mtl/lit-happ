import {AppWebsocket, CellId} from "@holochain/client";
import {AgnosticClient, HolochainClient} from '@holochain-open-dev/cell-client';
import {serializeHash} from "@holochain-open-dev/utils";
import {AgentPubKeyB64, DnaHashB64} from "@holochain-open-dev/core-types";


export interface ZomeCallRequest {
  zomeName: string,
  fnName: string,
  payload: any,
  timestamp: number,
}

export interface ZomeCallResponse {
  success?: any,
  failure?: any,
  timestamp: number,
  requestIndex: number;
}

export const delay = (ms:number) => new Promise(r => setTimeout(r, ms))


/**
 * Handles the connection to a Cell.
 * Logs ZomeCalls and dispatch Signals.
 * This class is expected to be used by Zome Bridges.
 */
export class DnaClient {
  /** async Factory */
  static async new(port: number, installedAppId: string): Promise<DnaClient> {
    const wsUrl = `ws://localhost:${port}`
    try {
      const appWebsocket = await AppWebsocket.connect(wsUrl)
      console.log({appWebsocket})
      const hcClient = new HolochainClient(appWebsocket)
      /** Setup Context */
      const appInfo = await hcClient.appWebsocket.appInfo({installed_app_id: installedAppId})
      const cellId = appInfo.cell_data[0].cell_id;
      return new DnaClient(hcClient, cellId);
    } catch (e) {
      console.error("DnaClient initialization failed", e)
      return Promise.reject("DnaClient initialization failed");
    }
  }



  /** Ctor */
  constructor(public agnosticClient: AgnosticClient, public cellId: CellId, defaultTimeout?: number) {
    this.defaultTimeout = defaultTimeout? defaultTimeout : 10 * 1000;
    this.myAgentPubKey = serializeHash(cellId[1]);
    this.dnaHash = serializeHash(cellId[0]);
  }

  /** -- Fields -- */

  readonly myAgentPubKey: AgentPubKeyB64;
  readonly dnaHash: DnaHashB64;
  defaultTimeout: number;

  private _requestLog: ZomeCallRequest[] = []
  private _responseLog: ZomeCallResponse[] = []

  private _write_mutex_locked: boolean = false;

  /** Checks if obj is a Hash or list of hashes
   * and tries to convert it a B64 or list of B64
   */
  private anyToB64(obj: any): any {
    /** Check if its a hash */
    if (obj instanceof Uint8Array) {
      return serializeHash(obj);
    } else {
      /** Check if its an array of hashes */
      if (Array.isArray(obj)) {
        const isUint8Array =
          obj.length > 0 &&
          obj.every((value) => {
            return value instanceof Uint8Array;
          });
        if (isUint8Array) {
          let result = [];
          for (const cur of obj) {
            result.push(serializeHash(cur));
          }
          return result;
        }
      }
    }
    return obj;
  }

  /** -- Methods -- */

  /**
   * callZome() with "Mutex" (for calls that writes to source-chain)
   */
  async callZomeBlocking(zomeName: string, fnName: string, payload: any): Promise<any> {
    const startTime = Date.now()
    if (this._write_mutex_locked && Date.now() - startTime < this.defaultTimeout) {
      await delay(1);
    }
    if (Date.now() - startTime >= this.defaultTimeout) {
      return Promise.reject("callZome failed: Blocked by other zome calls (timedout");
    }
    this._write_mutex_locked = true;
    const result = await this.callZome(zomeName, fnName, payload);
    this._write_mutex_locked = false;
    return result;
  }


  /** */
  async callZome(zomeName: string, fnName: string, payload: any, timeout?: number): Promise<any> {
    //console.log("callZome: agent_directory." + fn_name + "() ", payload)
    //console.info({payload})
    const requestIndex = this._requestLog.length;
    const request: ZomeCallRequest = {zomeName, fnName, timestamp: Date.now(), payload: this.anyToB64(payload)};
    this._requestLog.push(request)
    try {
      const result = await this.agnosticClient.callZome(this.cellId, zomeName, fnName, payload, this.defaultTimeout);
      //console.log("callZome: agent_directory." + fn_name + "() result")
      //console.info({result})
      let success = this.anyToB64(result)
      this._responseLog.push({success, timestamp: Date.now(), requestIndex})
      return result;
    } catch (e) {
      console.error("Calling zome + " + zomeName + "." + fnName + "() failed: ")
      console.error({e})
      this._responseLog.push({failure: e, timestamp: Date.now(), requestIndex})
    }
    return Promise.reject("callZome failed")
  }


  // /** */
  // dumpAllZomes() {
  //   // FIXME get DNA DEF
  //   for (const zomeName of dnaDef) {
  //     this.dumpLogs(zomeName)
  //   }
  // }


  /**  */
  dumpLogs(zomeName?: string) {
    let result = [];
    for (const response of this._responseLog) {
      const request = this._requestLog[response.requestIndex];
      if (zomeName && request.zomeName != zomeName) {
        continue;
      }

      const zeroPad = (num:number, places:number) => String(num).padStart(places, '0')

      const startDate = new Date(request.timestamp);
      const startTime = ""
        + zeroPad(startDate.getHours(), 2)
        + ":" + zeroPad(startDate.getMinutes(), 2)
        + ":" + zeroPad(startDate.getSeconds(), 2)
        + "." + zeroPad(startDate.getMilliseconds(), 3);
      const durationDate = new Date(response.timestamp - request.timestamp);
      const duration = durationDate.getSeconds() + "." + zeroPad(durationDate.getMilliseconds(),3)
      const input = request.payload instanceof Uint8Array? serializeHash(request.payload) : request.payload;
      const output = response.failure? response.failure: response.success;
      const log = zomeName? {startTime,fnName: request.fnName, input, output, duration}
        : {startTime, zomeName: request.zomeName, fnName: request.fnName, input, output, duration}
      result.push(log)
    }
    if(zomeName) console.log("Call log for zome " + zomeName)
    console.table(result)
  }

}
