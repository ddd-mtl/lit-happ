import {CellDef, DnaModifiersOptions, DnaViewModel, ZomeProxy, ZomeViewModel, ZvmDef} from "@ddd-qc/lit-happ";
import {AppSignal, EntryHash} from "@holochain/client";
import { LabelZvm } from "./label";

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

  static readonly ZOME_PROXY = RealZomeProxy;


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


export const REAL_DEF: ZvmDef[] = [RealZvm, [LabelZvm, "zRealLabel"]];

/**
 *
 */
export class RealDvm extends DnaViewModel {

  /** -- DnaViewModel Interface -- */

  static readonly DEFAULT_BASE_ROLE_NAME = "rReal";
  static readonly ZVM_DEFS = REAL_DEF;
  readonly signalHandler = this.handleRealSignal;

  /** QoL Helpers */
  get realZvm(): RealZvm { return this.getZomeViewModel(RealZvm.DEFAULT_ZOME_NAME) as RealZvm }
  get labelZvm(): LabelZvm { return this.getZomeViewModel("zRealLabel") as LabelZvm }


  /** -- ViewModel Interface -- */

  protected hasChanged(): boolean { return true }

  get perspective(): number { return 3.1418 }

  /** methods */
  handleRealSignal(appSignal: AppSignal): void {
    console.warn("RealSignal received:", appSignal);
  }

}



export const REAL_DNA_MODIFIERS: DnaModifiersOptions = {};


/**
 *
 */
export class RealCloneDvm extends DnaViewModel {

  /** -- DnaViewModel Interface -- */

  static readonly DEFAULT_BASE_ROLE_NAME = "rReal";
  static readonly ZVM_DEFS = REAL_DEF;
  static readonly DNA_MODIFIERS = REAL_DNA_MODIFIERS;

  readonly signalHandler = this.handleRealSignal;

  /** QoL Helpers */
  get realZvm(): RealZvm { return this.getZomeViewModel(RealZvm.DEFAULT_ZOME_NAME) as RealZvm }
  get labelZvm(): LabelZvm { return this.getZomeViewModel("zRealLabel") as LabelZvm }


  /** -- ViewModel Interface -- */

  protected hasChanged(): boolean { return true }

  get perspective(): number { return 3.1418 }

  /** methods */
  handleRealSignal(appSignal: AppSignal): void {
    //console.warn("RealSignal received:", appSignal);
  }

}
