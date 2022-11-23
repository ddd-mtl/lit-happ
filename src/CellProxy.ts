import {CallZomeRequest, CapSecret, CellId, InstalledCell, RoleId} from "@holochain/client";
import { serializeHash } from "@holochain-open-dev/utils";
import { AgentPubKeyB64, DnaHashB64 } from "@holochain-open-dev/core-types";
import { ConductorAppProxy } from "./ConductorAppProxy";
import {CellDef} from "./CellDef";


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
 * Proxy for a running DNA.
 * It logs and queues ZomeCalls.
 * It holds a reference to its ConductorAppProxy and its cellData.
 * This class is expected to be used by ZomeProxies.
 */
export class CellProxy implements CellDef {

  /** Ctor */
  constructor(private _conductor: ConductorAppProxy, public cellDef: InstalledCell, defaultTimeout?: number) {
    this.defaultTimeout = defaultTimeout ? defaultTimeout : 10 * 1000;
  }


  /** -- Fields -- */

  defaultTimeout: number;

  private _blockingRequestQueue: RequestLog[] = [];
  private _requestLog: RequestLog[] = []
  private _responseLog: ResponseLog[] = []

  private _callMutex: boolean = false;


  /** -- CellDef interface -- */

  get roleId(): RoleId { return this.cellDef.role_id }
  get cellId(): CellId { return this.cellDef.cell_id }
  get dnaHash(): DnaHashB64 { return serializeHash(this.cellDef.cell_id[0]) }
  get agentPubKey(): AgentPubKeyB64 { return serializeHash(this.cellDef.cell_id[1]) }

  /** -- Methods -- */

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
      cell_id: this.cellDef.cell_id,
      provenance: this.cellDef.cell_id[1],
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


  /**
   * Calls the `entry_defs()` zome function and
   * returns an array of all the zome's AppEntryDefNames and visibility
   */
  async callEntryDefs(zomeName: string): Promise<[string, boolean][]> {
    try {
      const entryDefs = await this.callZome(zomeName, "entry_defs", null, null, 2 * 1000);
      //console.debug("getEntryDefs() for " + this.zomeName + " result:")
      //console.log({entryDefs})
      let result: [string, boolean][] = []
      for (const def of entryDefs.Defs) {
        const name = def.id.App;
        result.push([name, def.visibility.hasOwnProperty('Public') ])
      }
      //console.log({result})
      return result;
    } catch (e) {
      console.error("Calling getEntryDefs() on " + zomeName + " failed: ")
      console.error({e})
      return Promise.reject(e)
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
