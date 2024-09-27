import {DnaModifiersOptions, DnaViewModel, EntryId, ZomeViewModel, ZvmDef} from "@ddd-qc/lit-happ";
import {AppSignal} from "@holochain/client";
import { LabelZvm } from "./label";
import {RealProxy} from "../bindings/real.proxy";


/** */
export interface RealZomePerspective {
  floats: number[];
}


/**
 *
 */
export class RealZvm extends ZomeViewModel {

  /** -- ZomeViewModel Interface -- */

  static override readonly ZOME_PROXY = RealProxy;


  /** -- ViewModel Interface -- */

  get zomeProxy(): RealProxy { return this._zomeProxy as RealProxy; }

  get perspective(): RealZomePerspective { return { floats: this._values } }

  private _values: number[] = [];


  override async probeAllInner(): Promise<void> {
    //let entryDefs = await this._proxy.getEntryDefs();
    //console.log({entryDefs})
    this._values = await this.zomeProxy.getMyReals();
    this.notifySubscribers();
  }

  /**  */
  async createReal(value: number): Promise<EntryId> {
    const res = await this.zomeProxy.createReal(value);
    /** Add directly to perspective */
    this._values.push(value);
    this.notifySubscribers();
    return new EntryId(res);
  }
}


export const REAL_DEF: ZvmDef[] = [RealZvm, [LabelZvm, "zRealLabel"]];

/**
 *
 */
export class NamedRealDvm extends DnaViewModel {

  /** -- DnaViewModel Interface -- */

  static override readonly DEFAULT_BASE_ROLE_NAME = "rNamedReal";
  static override readonly ZVM_DEFS = REAL_DEF;
  readonly signalHandler = this.handleRealSignal;

  /** QoL Helpers */
  get realZvm(): RealZvm { return this.getZomeViewModel(RealZvm.DEFAULT_ZOME_NAME) as RealZvm }
  get labelZvm(): LabelZvm { return this.getZomeViewModel("zRealLabel") as LabelZvm }


  /** -- ViewModel Interface -- */

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
export class NamedRealCloneDvm extends DnaViewModel {

  /** -- DnaViewModel Interface -- */

  static override readonly DEFAULT_BASE_ROLE_NAME = "rNamedReal";
  static override readonly ZVM_DEFS = REAL_DEF;
  static override readonly DNA_MODIFIERS = REAL_DNA_MODIFIERS;

  readonly signalHandler = this.handleRealSignal;

  /** QoL Helpers */
  get realZvm(): RealZvm { return this.getZomeViewModel(RealZvm.DEFAULT_ZOME_NAME) as RealZvm }
  get labelZvm(): LabelZvm { return this.getZomeViewModel("zRealLabel") as LabelZvm }


  /** -- ViewModel Interface -- */

  get perspective(): number { return 3.1418 }

  /** methods */
  handleRealSignal(_appSignal: AppSignal): void {
    //console.warn("RealSignal received:", appSignal);
  }

}
