import {CellProxy, DnaViewModel, HappViewModel, ZomeProxy, ZomeViewModel} from "@ddd-qc/dna-client";
import {EntryHash, RoleId, ZomeName} from "@holochain/client";
import {LabelZvm} from "./label";
import {DummyZomeProxy} from "./dummy";


/** */
export interface RealZomePerspective {
  floats: number[];
}


/**
 *
 */
export class RealZomeProxy extends ZomeProxy {

  async getReal(eh: EntryHash): Promise<number> {
    return this.call('get_real', eh);
  }
  async createReal(value: number): Promise<EntryHash> {
    return this.callBlocking('create_real', value);
  }
  async getMyReals(): Promise<number[]> {
    return this.call('get_my_reals', null);
  }
}


/**
 *
 */
export class RealZvm extends ZomeViewModel {

  static DEFAULT_ZOME_NAME = "zReal";

  /** Ctor */
  constructor(protected _cellProxy: CellProxy, zomeName?: ZomeName) {
    super(new RealZomeProxy(_cellProxy, zomeName? zomeName:RealZvm.DEFAULT_ZOME_NAME));
  }

  private _values: number[] = [];


  /** -- ViewModel Interface -- */

  get zomeProxy(): RealZomeProxy {return this._baseZomeProxy as RealZomeProxy;}

  protected hasChanged(): boolean {return true}

  get perspective(): RealZomePerspective {return {floats: this._values}}

  async probeAll(): Promise<void> {
    //let entryDefs = await this._proxy.getEntryDefs();
    //console.log({entryDefs})
    this._values = await this.zomeProxy.getMyReals();
    this.notifySubscribers();
  }

  /**  */
  async createReal(value: number): Promise<EntryHash> {
    const res = await this.zomeProxy.createReal(value);
    /** Add directly to perspective */
    this._values.push(value);
    this.notifySubscribers();
    return res;
  }
}


/**
 *
 */
export class RealDvm extends DnaViewModel {

  static DEFAULT_ROLE_ID = "rReal";

  /** Ctor */
  constructor(happ: HappViewModel, roleId?: RoleId) {
    super(happ, [RealZvm, LabelZvm], roleId);
  }

  /** QoL Helpers */
  get realZvm(): RealZvm {return this.getZomeViewModel(RealZvm.DEFAULT_ZOME_NAME) as RealZvm}
  get labelZvm(): LabelZvm {return this.getZomeViewModel(LabelZvm.DEFAULT_ZOME_NAME) as LabelZvm}


  /** -- ViewModel Interface -- */

  protected hasChanged(): boolean {return true}

  get perspective(): number {return 3.1418}

}

