import {AppSignalCb, CallZomeRequest, CapSecret, encodeHashToBase64, ZomeName} from "@holochain/client";
import {anyToB64, prettyDate, prettyDuration} from "./utils";
import {CellMixin, Empty} from "./mixins";
import {Cell} from "./cell";
import {DnaInfo, EntryDefsCallbackResult, ZomeInfo} from "./types";
import {Mutex, withTimeout} from "async-mutex";
import MutexInterface from "async-mutex/lib/MutexInterface";
import {AppProxy, SignalUnsubscriber} from "./AppProxy";


export interface RequestLog {
  request: CallZomeRequest,
  timeout: number,
  requestTimestamp: number,
  executionTimestamp: number,
}

export interface ResponseLog {
  success?: unknown,
  failure?: unknown,
  timestamp: number,
  requestIndex: number;
}


export type Cb = () => Promise<unknown>

/**
 * Proxy for a running DNA.
 * It logs and queues ZomeCalls.
 * It holds a reference to its AppProxy and its Cell.
 * This class is expected to be used by ZomeProxies.
 */
export class CellProxy extends CellMixin(Empty) {

  /** Ctor */
  constructor(
    private _appProxy: AppProxy,
    cell: Cell,
    //public readonly dnaDef: MyDnaDef,
    defaultTimeout?: number) {
    super();
    this._cell = cell;
    console.log(`CellProxy.ctor`, cell);
    this.defaultTimeout = defaultTimeout ? defaultTimeout : 10 * 1000;
    this._callMutex = withTimeout(new Mutex(), this.defaultTimeout);
  }


  /** -- Fields -- */

  defaultTimeout: number;
  protected _callMutex: MutexInterface;



  /** append only logs */
  private _requestLog: RequestLog[] = []
  private _responseLog: ResponseLog[] = []


  /** -- Methods -- */

  /** */
  addSignalHandler(handler: AppSignalCb): SignalUnsubscriber {
    return this._appProxy.addSignalHandler(handler, this.cell.hcl().toString());
  }


  /** */
  dumpSignals() {
    this._appProxy.dumpSignals(this.cell.id);
  }

  /** Pass call request to conductor proxy and log it */
  async executeZomeCall(reqLog: RequestLog): Promise<ResponseLog> {
    reqLog.executionTimestamp = Date.now();
    const requestIndex = this._requestLog.length;
    this._requestLog.push(reqLog);
    try {
      const response = await this._appProxy.callZome(reqLog.request, reqLog.timeout);
      const respLog = { requestIndex, success: response, timestamp: Date.now() };
      this._responseLog.push(respLog);
      return respLog;
    } catch (e) {
      const respLog = { requestIndex, failure: e, timestamp: Date.now() }
      this._responseLog.push(respLog);
      return respLog;
    }
  }


  /** Pass call request to conductor proxy and log it */
  logCallTimedout(reqLog: RequestLog): ResponseLog {
    reqLog.executionTimestamp = Date.now();
    const requestIndex = this._requestLog.length;
    this._requestLog.push(reqLog);
    const respLog = { requestIndex, failure: "Waiting for Mutex timed-out", timestamp: Date.now() }
    this._responseLog.push(respLog);
    return respLog;
  }


  /**
   * callZome() with Mutex (for calls that writes to source-chain)
   * TODO: Implement call queue instead of mutex?
   */
  async callZomeBlocking(zome_name: ZomeName, fn_name: string, payload: any, cap_secret: CapSecret | null, timeout?: number): Promise<unknown> {
    timeout = timeout? timeout : this.defaultTimeout;
    const req = {
      cap_secret, zome_name, fn_name, payload,
      cell_id: this.cell.id,
      provenance: this.cell.id[1],
    } as CallZomeRequest;
    const log = { request: req, timeout, requestTimestamp: Date.now() } as RequestLog;

    /** Acquire lock */
    let release;
    try {
      release = await this._callMutex.acquire();
    } catch(e) {
      console.warn("Waiting for callZomeBlocking mutex timed-out", e);
      this.logCallTimedout(log)
      return Promise.reject("Waiting for callZomeBlocking mutex timed-out");
    }
    /** Execute */
    const respLog = await this.executeZomeCall(log);
    /** Release */
    release();
    if (respLog.failure) {
      this.dumpSignals();
      this.dumpLogs(zome_name);
      return Promise.reject(respLog.failure)
    }
    return respLog.success;
  }


  /** */
  async callZome(zome_name: ZomeName, fn_name: string, payload: any, cap_secret: CapSecret | null, timeout?: number): Promise<unknown> {
    timeout = timeout? timeout : this.defaultTimeout;
    const req = {
      cap_secret, zome_name, fn_name, payload,
      cell_id: this.cell.id,
      provenance: this.cell.id[1],
    } as CallZomeRequest;
    const log = { request: req, timeout, requestTimestamp: Date.now() } as RequestLog;
    try {
      await this._callMutex.waitForUnlock();
    } catch(e) {
      console.warn("Waiting for callZome mutex timed-out", e);
      this.logCallTimedout(log);
      return Promise.reject("Waiting for callZome mutex timed-out");
    }
    const respLog = await this.executeZomeCall(log);
    if (respLog.failure) {
      this.dumpSignals();
      this.dumpLogs(zome_name);
      return Promise.reject(respLog.failure)
    }
    return respLog.success;
  }


  /**
   * Calls the `entry_defs()` zome function and
   * Returns an array of all the zome's AppEntryNames and Visibility, i.e. (AppEntryName, isPublic)[]
   */
  async callEntryDefs(zomeName: ZomeName): Promise<[string, boolean][]> {
    //console.log("callEntryDefs()", zomeName)
    try {
      const entryDefs = await this.callZome(zomeName, "entry_defs", null, null, 5 * 1000) as EntryDefsCallbackResult;
      //console.debug("getEntryDefs() for " + this.zomeName + " result:")
      //console.log({entryDefs})
      let result: [string, boolean][] = []
      for (const def of entryDefs.Defs) {
        const name = def.id.App;
        result.push([name, def.visibility.hasOwnProperty('Public')])
      }
      //console.log({result})
      return result;
    } catch (e) {
      console.error("Calling getEntryDefs() on " + zomeName + " failed: ")
      console.error({ e })
      return Promise.reject(e)
    }
  }



  /**
   * Calls the `zome_info()` zome function
   */
  async callZomeInfo(zomeName: ZomeName): Promise<ZomeInfo> {
    console.log("callZomeInfo()", zomeName)
    try {
      const zome_info = await this.callZome(zomeName, "get_zome_info", null, null, 10 * 100) as ZomeInfo;
      //console.debug("callZomeInfo() for " + zomeName + " result:")
      //console.log({zome_info})
      return zome_info;
    } catch (e) {
      console.error("Calling callZomeInfo() on " + zomeName + " failed. Make sure `get_zome_info()` is implemented in your zome code. Error: ")
      console.error({ e })
      return Promise.reject(e)
    }
  }


  /**
   * Calls the `dna_info()` zome function
   */
  async callDnaInfo(zomeName: ZomeName): Promise<DnaInfo> {
    console.log("callDnaInfo()", zomeName)
    try {
      const dna_info = await this.callZome(zomeName, "get_dna_info", null, null, 10 * 100) as DnaInfo;
      //console.debug("callDnaInfo() for " + zomeName + " result:")
      //console.log({dna_info})
      return dna_info;
    } catch (e) {
      console.error("Calling callDnaInfo() on " + zomeName + " failed. Make sure `get_dna_info()` is implemented in your zome code. Error: ")
      console.error({ e })
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
  dumpLogs(zomeName?: ZomeName) {
    let result = [];
    for (const response of this._responseLog) {
      const requestLog = this._requestLog[response.requestIndex];
      if (zomeName && requestLog.request.zome_name != zomeName) {
        continue;
      }
      const startTime = prettyDate(new Date(requestLog.requestTimestamp));
      const waitTime = prettyDuration(new Date(requestLog.executionTimestamp - requestLog.requestTimestamp));
      const duration = prettyDuration(new Date(response.timestamp - requestLog.requestTimestamp));
      const input = requestLog.request.payload instanceof Uint8Array ? encodeHashToBase64(requestLog.request.payload) : requestLog.request.payload;
      const output = anyToB64(response.failure ? response.failure : response.success);
      const log = zomeName
        ? { startTime, fnName: requestLog.request.fn_name, input, output, duration, waitTime }
        : { startTime, zomeName: requestLog.request.zome_name, fnName: requestLog.request.fn_name, input, output, duration, waitTime }
      result.push(log);
    }
    console.warn(`Dumping logs for cell "${this._appProxy.getLocations(this.cell.id)}"`)
    if (zomeName) {
      console.warn(` - For zome "${zomeName}"`);
    }
    console.table(result)
  }

}

