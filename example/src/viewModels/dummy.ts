import {DnaViewModel, ZomeProxy, ZomeViewModel} from "@ddd-qc/dna-client";
import {EntryHash} from "@holochain/client";
import {LabelZomeProxy, LabelZvm} from "./label";


/**
 *
 */
export class DummyZomeProxy extends ZomeProxy {

  static readonly DEFAULT_ZOME_NAME = "zDummy"

  async getDummy(eh: EntryHash): Promise<number> {
    return this.call('get_dummy', eh);
  }
  async createDummy(value: number): Promise<EntryHash> {
    return this.callBlocking('create_dummy', value);
  }
  async getMyDummies(): Promise<number[]> {
    return this.call('get_my_dummies', null);
  }
}


/** */
export interface DummyZomePerspective {
  values: number[];
}


/**
 * FIXME ZomeViewModel<F extends ZomeProxyFactory>
 */
export class DummyZvm extends ZomeViewModel {

  /** -- ZomeViewModel Interface -- */

  static readonly ZOME_PROXY_FACTORY = DummyZomeProxy;

  get zomeProxy(): DummyZomeProxy {return this._zomeProxy as DummyZomeProxy;}

  protected hasChanged(): boolean {return true}

  get perspective(): DummyZomePerspective {return {values: this._values}}

  private _values: number[] = [];


  /** */
  async probeAll(): Promise<void> {
    //let entryDefs = await this._proxy.getEntryDefs();
    //console.log({entryDefs})
    this._values = await this.zomeProxy.getMyDummies();
    this.notifySubscribers();
  }


  /** -- Dummy specific methods -- */

  /**  */
  async createDummy(value: number): Promise<EntryHash> {
    const res = await this.zomeProxy.createDummy(value);
    /** Add directly to perspective */
    this._values.push(value);
    this.notifySubscribers();
    return res;
  }
}


/**
 *
 */
export class DummyDvm extends DnaViewModel {

  /** -- DnaViewModel Interface -- */

  static readonly DEFAULT_ROLE_ID = "rDummy";
  static readonly ZVM_DEFS = [DummyZvm, LabelZvm]

  /** QoL Helpers */
  get dummyZvm(): DummyZvm {return this.getZomeViewModel(DummyZvm.DEFAULT_ZOME_NAME) as DummyZvm}

  //get dummyZvm(): DummyZvm {return this.getZomeViewModel(DummyZomeProxy.DEFAULT_ZOME_NAME) as DummyZvm}
  get labelZvm(): LabelZvm {return this.getZomeViewModel(LabelZomeProxy.DEFAULT_ZOME_NAME) as LabelZvm}


  /** -- ViewModel Interface -- */

  protected hasChanged(): boolean {return true}

  get perspective(): number {return 4242}

}

