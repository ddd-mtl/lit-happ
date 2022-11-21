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
  async createLabel(value: number): Promise<EntryHash> {
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
  constructor(protected proxy: CellProxy) {
    super(new LabelZomeProxy(proxy));
  }

  private _values: string[] = [];

  /** -- ViewModel Interface -- */

  static context = createContext<LabelZvm>('zvm/label');
  getContext():any {return LabelZvm.context}

  protected hasChanged(): boolean {return true}

  get perspective(): LabelZomePerspective {return {values: this._values}}

  async probeAll(): Promise<void> {
    //let entryDefs = await this._proxy.getEntryDefs();
    //console.log({entryDefs})
    this._values = await this._proxy.getMyLabels();
  }
}
