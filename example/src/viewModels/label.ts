import {CellProxy, ZomeProxy, ZomeViewModel} from "@ddd-qc/dna-client";
import { EntryHash } from "@holochain/client";
import {createContext} from "@lit-labs/context";


/**
 *
 */
export interface LabelZomePerspective {
  values: string[],
}


/**
 *
 */
export class LabelZomeProxy extends ZomeProxy {
  get zomeName(): string {return "label"}
  async getLabel(eh: EntryHash): Promise<string> {
    return this.call('get_label', eh, null);
  }
  async createLabel(value: string): Promise<EntryHash> {
    return this.call('create_label', value, null);
  }
  async getMyLabels(): Promise<string[]> {
    return this.call('get_my_labels', null, null);
  }
}


/**
 *
 */
export class LabelZvm extends ZomeViewModel<LabelZomePerspective, LabelZomeProxy> {
  /** Ctor */
  constructor(protected _cellProxy: CellProxy) {
    super(new LabelZomeProxy(_cellProxy));
  }

  private _values: string[] = [];

  /** -- ViewModel Interface -- */

  //static context = createContext<LabelZvm>('zvm/label');
  //getContext(): any {return LabelZvm.context}

  //getContext(): any {return createContext<LabelZvm>('zvm/label/' + this._cellProxy.dnaHash)}

  protected hasChanged(): boolean {return true}

  get perspective(): LabelZomePerspective {return {values: this._values}}

  /** */
  async probeAll(): Promise<void> {
    //let entryDefs = await this._proxy.getEntryDefs();
    //console.log({entryDefs})
    this._values = await this._zomeProxy.getMyLabels();
    this.notifySubscribers();
  }

  /** -- API  -- */

  /**  */
  async createLabel(value: string): Promise<EntryHash> {
    const res = await this._zomeProxy.createLabel(value);
    /** Add directly to perspective */
    this._values.push(value);
    this.notifySubscribers();
    return res;
  }
}
