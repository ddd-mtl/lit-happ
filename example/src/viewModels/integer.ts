import {
  ActionId,
  DnaViewModel,
  ZomeViewModel, ZomeViewModelWithSignals,
  ZvmDef
} from "@ddd-qc/lit-happ";
import {AppSignal, AppSignalCb} from "@holochain/client";
import {LabelZvm} from "./label";
import {IntegerProxy} from "../bindings/integer.proxy";


/** */
export interface IntegerZomePerspective {
  values: number[],
}


/**
 *
 */
export class IntegerZvm extends ZomeViewModelWithSignals {

  /** Test zvmChanged */
  randomValue = "whatever";

  /** -- ZomeViewModel Interface -- */

  static override readonly ZOME_PROXY = IntegerProxy;

  get zomeProxy(): IntegerProxy {return this._zomeProxy as IntegerProxy;}

  protected hasChanged(): boolean {return true}

  get perspective(): IntegerZomePerspective {return {values: this._values}}

  private _values: number[] = [];
  private _knowns: ActionId[] = [];


  /** */
  override async initializePerspectiveOffline(): Promise<void> {
    const pairs = await this.zomeProxy.getMyValuesLocal();
    this._values = pairs.map(([_a, b]) => b);
    this._knowns = pairs.map(([a, _b]) => new ActionId(a));
    this.notifySubscribers();
  }

  /** */
  override async initializePerspectiveOnline(): Promise<void> {
    const pairs = await this.zomeProxy.getMyValues();
    this._values = pairs.map(([_a, b]) => b);
    this._knowns = pairs.map(([a, _b]) => new ActionId(a));
    this.notifySubscribers();
  }

  /** */
  override probeAllInner(): void {
    //let entryDefs = await this._proxy.getEntryDefs();
    const knowns = this._knowns.map((id) => id.hash);
    console.log("knowns", this._knowns, knowns);
    this.zomeProxy.getMyValuesIncremental(knowns).then((pairs) => {
        pairs.map(([a, b]) => {
          this._values.push(b);
          this._knowns.push(new ActionId(a));
        });
      this.notifySubscribers();
    })
  }


  /** -- Integer specific methods -- */

  /**  */
  async createInteger(value: number, canBlock: boolean): Promise<ActionId> {
    const zi = await this.zomeProxy.zomeInfo();
    console.log({zi});
    const di = await this.zomeProxy.dnaInfo();
    console.log({di});
    let ah: Uint8Array;
    if (canBlock) {
      ah = await this.zomeProxy.createBlockingInteger(value);
    } else {
      ah = await this.zomeProxy.createInteger(value);
    }
    const action = new ActionId(ah);
    /** Add directly to perspective */
    this._values.push(value);
    this._knowns.push(action);
    this.notifySubscribers();
    return action;
  }
}


/**
 *
 */
export class NamedIntegerDvm extends DnaViewModel {

  /** -- DnaViewModel Interface -- */

  static override readonly DEFAULT_BASE_ROLE_NAME = "rNamedInteger";
  static override readonly ZVM_DEFS: ZvmDef[] = [IntegerZvm, [LabelZvm, "zIntegerLabel"]];

  readonly signalHandler: AppSignalCb = this.handleSignal;

  /** QoL Helpers */
  get integerZvm(): IntegerZvm {return this.getZomeViewModel(IntegerZvm.DEFAULT_ZOME_NAME) as IntegerZvm}
  get labelZvm(): LabelZvm {return this.getZomeViewModel("zIntegerLabel") as LabelZvm}


  /** -- ViewModel Interface -- */

  protected hasChanged(): boolean {return true}

  get perspective(): number {return 4242}


  /** Methods */

  override zvmChanged(zvm: ZomeViewModel): void {
    console.log("NamedIntegerDvm.zvmChanged()", zvm.zomeName);
    if (zvm.zomeName == IntegerZvm.DEFAULT_ZOME_NAME) {
      const typed = zvm as IntegerZvm;
      console.log("NamedIntegerDvm.zvmChanged()", typed.randomValue);
    }
  }

  handleSignal(appSignal: AppSignal): void {
    console.warn("Signal for NamedInteger received:", appSignal);
  }

}

