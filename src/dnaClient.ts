import {CellId} from "@holochain/client";
import {AgnosticClient} from '@holochain-open-dev/cell-client';
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


/**
 *
 */
export class DnaClient {
  /** Ctor */
  constructor(public agnosticClient: AgnosticClient, public cellId: CellId, defaultTimeout?: number) {
    this.defaultTimeout = defaultTimeout? defaultTimeout : 10 * 1000;
    this.myAgentPubKey = serializeHash(cellId[1]);
    this.dnaHash = serializeHash(cellId[0]);
  }

  /** -- Fields -- */

  myAgentPubKey: AgentPubKeyB64;
  dnaHash: DnaHashB64;
  defaultTimeout: number;

  private _requestLog: ZomeCallRequest[] = []
  private _responseLog: ZomeCallResponse[] = []



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

  /** */
  async callZome(zomeName: string, fnName: string, payload: any): Promise<any> {
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


  /**  */
  dumpLogs(zomeName?: string) {
    let result = [];
    for (const response of this._responseLog) {
      const request = this._requestLog[response.requestIndex];
      if (zomeName && request.zomeName != zomeName) {
        continue;
      }
      const startDate = new Date(request.timestamp);
      const startTime = "" + startDate.getHours() + ":" + startDate.getMinutes() + ":" + startDate.getSeconds() + "." + startDate.getMilliseconds();
      const input = request.payload instanceof Uint8Array? serializeHash(request.payload) : request.payload;
      const output = response.failure? response.failure: response.success;
      const log = zomeName? {startTime,fnName: request.fnName, input, output}
        : {startTime, zomeName: request.zomeName, fnName: request.fnName, input, output}
      result.push(log)
    }
    if(zomeName) console.log("Call log for zome " + zomeName)
    console.table(result)
  }

}
