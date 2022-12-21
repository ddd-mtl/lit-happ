import {CallZomeRequest, CapSecret, encodeHashToBase64, ZomeName, Cell} from "@holochain/client";
import {ConductorAppProxy, SignalUnsubscriber} from "./ConductorAppProxy";
import {anyToB64, delay, prettyDate, prettyDuration, Queue} from "./utils";
import {CellSpecific} from "./mixins";


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
 * It holds a reference to its ConductorAppProxy and its InstalledCell.
 * This class is expected to be used by ZomeProxies.
 */
export class CellProxy extends CellSpecific {

  /** Ctor */
  constructor(
    private _conductor: ConductorAppProxy,
    cell: Cell,
    //public readonly dnaDef: MyDnaDef,
    defaultTimeout?: number) {
    super();
    this._cell = cell;
    this.defaultTimeout = defaultTimeout ? defaultTimeout : 10 * 1000;
  }


  /** -- Fields -- */

  defaultTimeout: number;

  //private _blockingRequestQueue: Queue<RequestLog> = new Queue();
  /** append only logs */
  private _requestLog: RequestLog[] = []
  private _responseLog: ResponseLog[] = []

  private _canCallBlocking: boolean = true;


  // /** -- ICell interface -- */
  //
  // get dnaHash(): DnaHashB64 { return encodeHashToBase64(this.cell.cell_id[0]) }
  // get agentPubKey(): AgentPubKeyB64 { return encodeHashToBase64(this.cell.cell_id[1]) }


  /** -- Methods -- */

  // /** */
  // addSignalHandler(handler: AppSignalCb): SignalUnsubscriber {
  //   return this._conductor.addSignalHandler(handler, this.cellId);
  // }

  dumpSignals() {
    this._conductor.dumpSignals(this.cell.cell_id);
  }

  /** Pass call request to conductor proxy and log it */
  async executeZomeCall(reqLog: RequestLog): Promise<ResponseLog> {
    reqLog.executionTimestamp = Date.now();
    const requestIndex = this._requestLog.length;
    this._requestLog.push(reqLog);
    try {
      const response = await this._conductor.callZome(reqLog.request, reqLog.timeout);
      const respLog = { requestIndex, success: response, timestamp: Date.now() };
      this._responseLog.push(respLog);
      return respLog;
    } catch (e) {
      const respLog = { requestIndex, failure: e, timestamp: Date.now() }
      this._responseLog.push(respLog);
      return respLog;
    }
  }


  /**
   * callZome() with "Mutex" (for calls that writes to source-chain)
   * TODO: Implement call queue instead of mutex
   */
  async callZomeBlocking(zome_name: ZomeName, fn_name: string, payload: any, cap_secret: CapSecret | null, timeout?: number): Promise<any> {
    timeout = timeout? timeout : this.defaultTimeout;
    const req = {
      cap_secret, zome_name, fn_name, payload,
      cell_id: this.cell.cell_id,
      provenance: this.cell.cell_id[1],
    } as CallZomeRequest;
    const log = { request: req, timeout, requestTimestamp: Date.now() } as RequestLog;

    while(!this._canCallBlocking && Date.now() - log.requestTimestamp < timeout) {
      await delay(1);
    }
    if (Date.now() - log.requestTimestamp >= timeout) {
      console.warn({requestLogs: this._requestLog})
      return Promise.reject("Waiting for zomeCall execution timed-out");
    }
    this._canCallBlocking = false;
    const respLog = await this.executeZomeCall(log);
    this._canCallBlocking = true;
    if (respLog.failure) {
      this.dumpSignals();
      this.dumpLogs(zome_name);
      return Promise.reject(respLog.failure)
    }
    return respLog.success;
  }

  /** */
  async callZome(zome_name: ZomeName, fn_name: string, payload: any, cap_secret: CapSecret | null, timeout?: number): Promise<any> {
    timeout = timeout? timeout : this.defaultTimeout;
    const req = {
      cap_secret, zome_name, fn_name, payload,
      cell_id: this.cell.cell_id,
      provenance: this.cell.cell_id[1],
    } as CallZomeRequest;
    const log = { request: req, timeout, requestTimestamp: Date.now() } as RequestLog;
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
   * returns an array of all the zome's AppEntryDefNames and visibility
   */
  async callEntryDefs(zomeName: ZomeName): Promise<[string, boolean][]> {
    //console.log("callEntryDefs()", zomeName)
    try {
      const entryDefs = await this.callZome(zomeName, "entry_defs", null, null, 2 * 1000);
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
    console.warn(`Dumping logs for cell "${this._conductor.getLocations(this.cellId)}"`)
    if (zomeName) {
      console.warn(` - For zome "${zomeName}"`);
    }
    console.table(result)
  }

}

