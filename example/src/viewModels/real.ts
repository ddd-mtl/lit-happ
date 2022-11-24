import {CellProxy, DnaViewModel, HappViewModel, ZomeProxy, ZomeViewModel} from "@ddd-qc/dna-client";
import {EntryHash, RoleId} from "@holochain/client";
import {createContext} from "@lit-labs/context";
import {LabelZvm} from "./label";

/** */
export class RealZomePerspective {
  static readonly zomeName = "zReal";
  values: number[] = [];
}


/**
 *
 */
export class RealZomeProxy extends ZomeProxy {

  readonly zomeName = RealZomePerspective.zomeName

  async getReal(eh: EntryHash): Promise<number> {
    return this.call('get_real', eh, null);
  }
  async createReal(value: number): Promise<EntryHash> {
    return this.call('create_real', value, null);
  }
  async getMyReals(): Promise<number[]> {
    return this.call('get_my_reals', null, null);
  }
}


/**
 *
 */
export class RealZvm extends ZomeViewModel<RealZomePerspective, RealZomeProxy> {
  /** Ctor */
  constructor(protected _cellProxy: CellProxy) {
    super(new RealZomeProxy(_cellProxy));
  }

  private _values: number[] = [];

  /** -- ViewModel Interface -- */

  protected hasChanged(): boolean {return true}

  get perspective(): RealZomePerspective {return {values: this._values}}

  async probeAll(): Promise<void> {
    //let entryDefs = await this._proxy.getEntryDefs();
    //console.log({entryDefs})
    this._values = await this._zomeProxy.getMyReals();
    this.notifySubscribers();
  }

  /**  */
  async createReal(value: number): Promise<EntryHash> {
    const res = await this._zomeProxy.createReal(value);
    /** Add directly to perspective */
    this._values.push(value);
    this.notifySubscribers();
    return res;
  }
}


/**
 *
 */
export class RealDvm extends DnaViewModel<number> {
  /** Ctor */
  constructor(happ: HappViewModel, roleId: RoleId) {
    super(happ, roleId, [RealZvm, LabelZvm]);
  }

  /** QoL Helpers */
  get realZvm(): RealZvm {return this.getZomeViewModel("zReal") as RealZvm}
  get labelZvm(): LabelZvm {return this.getZomeViewModel("zLabel") as LabelZvm}


  /** -- ViewModel Interface -- */

  // static context = createContext<RealDvm>('dvm/rReal');
  // getContext(): any {return RealDvm.context}

  protected hasChanged(): boolean {return true}

  get perspective(): number {return 3.1418}

}

