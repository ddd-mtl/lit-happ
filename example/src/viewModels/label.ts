import {ZomeProxy, ZomeViewModel} from "@ddd-qc/dna-client";
import { EntryHash } from "@holochain/client";


/**
 *
 */
export class LabelZomeProxy extends ZomeProxy {

  static readonly DEFAULT_ZOME_NAME: string = "zLabel";

  async getLabel(eh: EntryHash): Promise<string> {
    return this.call('get_label', eh);
  }
  async createLabel(value: string): Promise<EntryHash> {
    return this.callBlocking('create_label', value);
  }
  async getMyLabels(): Promise<string[]> {
    return this.call('get_my_labels', null);
  }
}


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

  static readonly ZOME_PROXY = LabelZomeProxy;
  get zomeProxy(): LabelZomeProxy {return this._zomeProxy as LabelZomeProxy;}

  get perspective(): LabelZomePerspective {return {names: this._values}}

  protected hasChanged(): boolean {return true}

  private _values: string[] = [];


  /** */
  async probeAll(): Promise<void> {
    //let entryDefs = await this._proxy.getEntryDefs();
    //console.log({entryDefs})
    this._values = await this.zomeProxy.getMyLabels();
    this.notifySubscribers();
  }

  /** -- API  -- */

  /**  */
  async createLabel(value: string): Promise<EntryHash> {
    const res = await this.zomeProxy.createLabel(value);
    /** Add directly to perspective */
    this._values.push(value);
    this.notifySubscribers();
    return res;
  }
}
