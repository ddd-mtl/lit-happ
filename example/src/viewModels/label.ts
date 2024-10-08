import {EntryId, ResponseLog, ZomeViewModel} from "@ddd-qc/lit-happ";
import {Signal, SignalCb} from "@holochain/client";
import {delay} from "@ddd-qc/cell-proxy";
import {LabelProxy} from "../bindings/label.proxy";

/**
 *
 */
 export interface LabelZomePerspective {
  names: string[];
}


/**
 *
 */
export class LabelZvm extends ZomeViewModel {

  /** -- ZomeViewModel Interface -- */

  static override readonly ZOME_PROXY = LabelProxy;
  get zomeProxy(): LabelProxy {return this._zomeProxy as LabelProxy;}

  get perspective(): LabelZomePerspective {return {names: this._values}}

  private _values: string[] = [];

  override readonly signalHandler: SignalCb = (signal: Signal) => {
    console.warn("Signal for zLabel zome received:", signal);
  }

  /** */
  override async probeAllInner(): Promise<void> {
    //let entryDefs = await this._proxy.getEntryDefs();
    //console.log({entryDefs})
    await delay(1000); // for testing probeAll mutex
    this._values = await this.zomeProxy.getMyLabels();
    this.notifySubscribers();
  }

  /** -- API  -- */

  /**  */
  async createLabel(value: string): Promise<EntryId> {
    const res = await this.zomeProxy.createLabel(value);
    try {
      //await delay(100);
      /*const _ =*/ await this.zomeProxy.createLabel(value); // Throttle test
    } catch(e) {
      const resp = e as ResponseLog;
      if (!resp.throttled) {
        Promise.reject(resp.failure);
      }
    }
    /** Add directly to perspective */
    this._values.push(value);
    this.notifySubscribers();
    return new EntryId(res);
  }
}
