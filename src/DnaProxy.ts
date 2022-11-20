import { AppSignal, AppSignalCb, AppWebsocket, CallZomeRequest, CapSecret, CellId, InstalledAppId, InstalledAppInfo, InstalledCell } from "@holochain/client";
import { serializeHash } from "@holochain-open-dev/utils";
import { AgentPubKeyB64, DnaHashB64 } from "@holochain-open-dev/core-types";
import { ConductorAppProxy } from "./ConductorAppProxy";


export interface RequestLog {
  request: CallZomeRequest,
  timeout: number,
  requestTimestamp: number,
  executionTimestamp: number,
}

export interface ResponseLog {
  success?: any,
  failure?: any,
  timestamp: number,
  requestIndex: number;
}


/**
 * Proxy for a DNA.
 * It logs ZomeCalls.
 * It holds a reference to its ConductorAppProxy and its cellData.
 * This class is expected to be used by ZomeProxies.
 */
export class DnaProxy {

  /** Ctor */
  constructor(private _conductor: ConductorAppProxy, public cellData: InstalledCell, defaultTimeout?: number) {
    this.defaultTimeout = defaultTimeout ? defaultTimeout : 10 * 1000;
  }


  /** -- Fields -- */

  defaultTimeout: number;

  private _blockingRequestQueue: RequestLog[] = [];
  private _requestLog: RequestLog[] = []
  private _responseLog: ResponseLog[] = []

  private _callMutex: boolean = false;


  /** -- Methods -- */

  get roleId(): string { return this.cellData.role_id }
  get dnaHash(): DnaHashB64 { return serializeHash(this.cellData.cell_id[0]) }
  get agentPubKey(): AgentPubKeyB64 { return serializeHash(this.cellData.cell_id[1]) }


  /**
   * callZome() with "Mutex" (for calls that writes to source-chain)
   */
  async callZomeBlocking(req: CallZomeRequest, timeout?: number): Promise<any> {
    this._callMutex = true;
    timeout = timeout ? timeout : this.defaultTimeout
    const result = await this._conductor.callZome(req, timeout);
    this._callMutex = false;
    return result;
  }


  /** Pass call request to conductor proxy and log it */
  async callZome(zome_name: string, fn_name: string, payload: any, cap_secret: CapSecret | null, timeout?: number): Promise<any> {
    timeout = timeout ? timeout : this.defaultTimeout
    const req = {
      cap_secret, zome_name, fn_name, payload,
      cell_id: this.cellData.cell_id,
      provenance: this.cellData.cell_id[1],
    } as CallZomeRequest;
    const log = {request: req, timeout, requestTimestamp: Date.now(), executionTimestamp: Date.now()} as RequestLog;
    const requestIndex = this._requestLog.length;
    this._requestLog.push(log);
    try {
      const response = await this._conductor.callZome(req, timeout);
      this._responseLog.push({requestIndex, success: response, timestamp: Date.now()});
      return response;
    } catch (e) {
      this._responseLog.push({requestIndex, failure: e, timestamp: Date.now()});
      return Promise.reject(e);
    }
  }

  // /** TODO once we have getDnaDefinition() api */
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
      const requestLog = this._requestLog[response.requestIndex];
      if (zomeName && requestLog.request.zome_name != zomeName) {
        continue;
      }

      const zeroPad = (num: number, places: number) => String(num).padStart(places, '0')

      const startDate = new Date(requestLog.requestTimestamp);
      const startTime = ""
        + zeroPad(startDate.getHours(), 2)
        + ":" + zeroPad(startDate.getMinutes(), 2)
        + ":" + zeroPad(startDate.getSeconds(), 2)
        + "." + zeroPad(startDate.getMilliseconds(), 3);
      const durationDate = new Date(response.timestamp - requestLog.requestTimestamp);
      const duration = durationDate.getSeconds() + "." + zeroPad(durationDate.getMilliseconds(), 3)
      const input = requestLog.request.payload instanceof Uint8Array ? serializeHash(requestLog.request.payload) : requestLog.request.payload;
      const output = response.failure ? response.failure : response.success;
      const log = zomeName ? { startTime, fnName: requestLog.request.fn_name, input, output, duration }
        : { startTime, zomeName: requestLog.request.zome_name, fnName: requestLog.request.fn_name, input, output, duration }
      result.push(log)
    }
    if (zomeName) console.log("Call log for zome " + zomeName)
    console.table(result)
  }

}
