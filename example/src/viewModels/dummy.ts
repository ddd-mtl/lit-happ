import {CellProxy, DnaViewModel, HappViewModel, ZomeProxy, ZomeViewModel} from "@ddd-qc/dna-client";
import { EntryHash } from "@holochain/client";
import {createContext} from "@lit-labs/context";
import {LabelZvm} from "./label";

/** */
export interface DummyZomePerspective {
  values: number[],
}


/**
 *
 */
export class DummyZomeProxy extends ZomeProxy {
  get zomeName(): string {return "dummy"}
  async getDummy(eh: EntryHash): Promise<number> {
    return this.call('get_dummy', eh, null);
  }
  async createDummy(value: number): Promise<EntryHash> {
    return this.call('create_dummy', value, null);
  }
  async getMyDummies(): Promise<number[]> {
    return this.call('get_my_dummies', null, null);
  }
}


/**
 *
 */
export class DummyZvm extends ZomeViewModel<DummyZomePerspective, DummyZomeProxy> {
  /** Ctor */
  constructor(protected _cellProxy: CellProxy) {
    super(new DummyZomeProxy(_cellProxy));
  }

  private _values: number[] = [];

  /** -- ViewModel Interface -- */

  getContext(): any {return createContext<DummyZvm>('zvm/dummy/' + this._cellProxy.dnaHash)}

  protected hasChanged(): boolean {return true}

  get perspective(): DummyZomePerspective {return {values: this._values}}

  /** */
  async probeAll(): Promise<void> {
    //let entryDefs = await this._proxy.getEntryDefs();
    //console.log({entryDefs})
    this._values = await this._zomeProxy.getMyDummies();
    this.notifySubscribers();
  }

  /**  */
  async createDummy(value: number): Promise<EntryHash> {
    const res = await this._zomeProxy.createDummy(value);
    /** Add directly to perspective */
    this._values.push(value);
    this.notifySubscribers();
    return res;
  }
}


/**
 *
 */
export class DummyDvm extends DnaViewModel<number> {
  /** Ctor */
  constructor(happ: HappViewModel, roleId: string) {
    const cellProxy = happ.conductorAppProxy.newCellProxy(happ.appInfo, roleId); // FIXME can throw error
    super(happ, cellProxy, [DummyZvm, LabelZvm]);
  }

  /** QoL Helpers */
  get dummyZvm(): DummyZvm {return this.getZomeViewModel("dummy") as DummyZvm}
  get labelZvm(): LabelZvm {return this.getZomeViewModel("label") as LabelZvm}


  /** -- ViewModel Interface -- */

  static context = createContext<DummyDvm>('dvm/dummy');
  getContext():any {return DummyDvm.context}

  protected hasChanged(): boolean {return true}

  get perspective(): number {return 4242}

}

