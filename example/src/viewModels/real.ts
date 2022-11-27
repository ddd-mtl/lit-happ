import { CellProxy, DnaViewModel, HappViewModel, ZomeProxy, ZomeViewModel } from "@ddd-qc/dna-client";
import { EntryHash, RoleId, ZomeName } from "@holochain/client";
import { LabelZomeProxy, LabelZvm } from "./label";


/**
 *
 */
export class RealZomeProxy extends ZomeProxy {

  static readonly DEFAULT_ZOME_NAME: string = "zReal";

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


/** */
export interface RealZomePerspective {
  floats: number[];
}


/**
 *
 */
export class RealZvm extends ZomeViewModel {

  /** -- ZomeViewModel Interface -- */

  static readonly ZOME_PROXY_FACTORY = RealZomeProxy;


  /** -- ViewModel Interface -- */

  get zomeProxy(): RealZomeProxy { return this._zomeProxy as RealZomeProxy; }

  protected hasChanged(): boolean { return true }

  get perspective(): RealZomePerspective { return { floats: this._values } }

  private _values: number[] = [];


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

  /** -- DnaViewModel Interface -- */

  static readonly DEFAULT_ROLE_ID = "rReal";
  static readonly ZVM_DEFS = [RealZvm, LabelZvm]

  /** QoL Helpers */
  get realZvm(): RealZvm { return this.getZomeViewModel(RealZvm.DEFAULT_ZOME_NAME) as RealZvm }
  get labelZvm(): LabelZvm { return this.getZomeViewModel(LabelZvm.DEFAULT_ZOME_NAME) as LabelZvm }
 

  /** -- ViewModel Interface -- */

  protected hasChanged(): boolean { return true }

  get perspective(): number { return 3.1418 }



}

