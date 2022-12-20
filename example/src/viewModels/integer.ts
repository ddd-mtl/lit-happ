import {DnaViewModel, ZomeProxy, ZomeViewModel, ZvmDef} from "@ddd-qc/lit-happ";
import {AppSignal, EntryHash, AppSignalCb} from "@holochain/client";
import {LabelZvm} from "./label";

/**
 *
 */
export class IntegerZomeProxy extends ZomeProxy {

  static readonly DEFAULT_ZOME_NAME = "zInteger"

  async getInteger(eh: EntryHash): Promise<number> {
    return this.call('get_integer', eh);
  }
  async createInteger(value: number): Promise<EntryHash> {
    return this.callBlocking('create_integer', value);
  }
  async getMyValues(): Promise<number[]> {
    return this.call('get_my_values', null);
  }
}


/** */
export interface IntegerZomePerspective {
  values: number[];
}


/**
 *
 */
export class IntegerZvm extends ZomeViewModel {

  /** -- ZomeViewModel Interface -- */

  static readonly ZOME_PROXY = IntegerZomeProxy;

  get zomeProxy(): IntegerZomeProxy {return this._zomeProxy as IntegerZomeProxy;}

  protected hasChanged(): boolean {return true}

  get perspective(): IntegerZomePerspective {return {values: this._values}}

  private _values: number[] = [];


  /** */
  async probeAll(): Promise<void> {
    //let entryDefs = await this._proxy.getEntryDefs();
    //console.log({entryDefs})
    this._values = await this.zomeProxy.getMyValues();
    this.notifySubscribers();
  }


  /** -- Dummy specific methods -- */

  /**  */
  async createInteger(value: number): Promise<EntryHash> {
    const res = await this.zomeProxy.createInteger(value);
    /** Add directly to perspective */
    this._values.push(value);
    this.notifySubscribers();
    return res;
  }
}


/**
 *
 */
export class NamedIntegerDvm extends DnaViewModel {

  /** -- DnaViewModel Interface -- */

  static readonly DEFAULT_BASE_ROLE_NAME = "rNamedInteger";
  static readonly ZVM_DEFS: ZvmDef[] = [IntegerZvm, [LabelZvm, "zIntegerLabel"]];

  readonly signalHandler: AppSignalCb = this.handleSignal;

  /** QoL Helpers */
  get integerZvm(): IntegerZvm {return this.getZomeViewModel(IntegerZvm.DEFAULT_ZOME_NAME) as IntegerZvm}
  get labelZvm(): LabelZvm {return this.getZomeViewModel("zIntegerLabel") as LabelZvm}


  /** -- ViewModel Interface -- */

  protected hasChanged(): boolean {return true}

  get perspective(): number {return 4242}

  /** methods */
  handleSignal(appSignal: AppSignal): void {
    console.warn("Signal for NamedInteger received:", appSignal);
  }

}

