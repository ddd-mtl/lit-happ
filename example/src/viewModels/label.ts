import {CellProxy, ZomeProxy, ZomeViewModel} from "@ddd-qc/dna-client";
import { EntryHash } from "@holochain/client";

/**
 *
 */
export interface LabelZomePerspective {
  names: string[];
}


/**
 *
 */
export class LabelZomeProxy extends ZomeProxy {

  static zomeName = "zLabel"

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
export class LabelZvm extends ZomeViewModel {
  /** Ctor */
  constructor(protected _cellProxy: CellProxy) {
    super(new LabelZomeProxy(_cellProxy));
  }

  private _values: string[] = [];


  /** -- (Zome)ViewModel Interface -- */

  get zomeProxy(): LabelZomeProxy {return this._baseZomeProxy as LabelZomeProxy;}

  protected hasChanged(): boolean {return true}

  get perspective(): LabelZomePerspective {return {names: this._values}}

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
