import {
  DnaViewModel,
  prettySignalLogs,
  SignalLog,
  SignalType,
  ZomeViewModel, ZomeViewModelWithSignals,
  ZvmDef
} from "@ddd-qc/lit-happ";
import {AppSignal, AppSignalCb, ActionHash} from "@holochain/client";
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

  static readonly ZOME_PROXY = IntegerProxy;

  get zomeProxy(): IntegerProxy {return this._zomeProxy as IntegerProxy;}

  protected hasChanged(): boolean {return true}

  get perspective(): IntegerZomePerspective {return {values: this._values}}

  private _values: number[] = [];
  private _knowns: ActionHash[] = [];

  readonly signalHandler: AppSignalCb = (appSignal: AppSignal) => {
    console.warn("Signal for zInteger zome received:", appSignal);
  }


  /** */
  dumpSignalLogs(signalLogs: SignalLog[]) {
    console.warn(`App signals from zome "${this.zomeName}"`);
    const appSignals = signalLogs.filter((log) => log.type == SignalType.Zome);
    console.table(prettySignalLogs(appSignals));
  }


  /** */
  async initializePerspectiveOffline(): Promise<void> {
    const pairs = await this.zomeProxy.getMyValuesLocal();
    this._values = pairs.map(([a, b]) => b);
    this._knowns = pairs.map(([a, b]) => a);
    this.notifySubscribers();
  }

  /** */
  async initializePerspectiveOnline(): Promise<void> {
    const pairs = await this.zomeProxy.getMyValues();
    this._values = pairs.map(([a, b]) => b);
    this._knowns = pairs.map(([a, b]) => a);
    this.notifySubscribers();
  }

  /** */
   probeAllInner(): void {
    //let entryDefs = await this._proxy.getEntryDefs();
    //console.log({entryDefs})
    this.zomeProxy.getMyValuesIncremental(this._knowns).then((pairs) => {
        pairs.map(([a, b]) => {
          this._values.push(b);
          this._knowns.push(a);
        });
      this.notifySubscribers();
    })
  }


  /** -- Integer specific methods -- */

  /**  */
  async createInteger(value: number, canBlock: boolean): Promise<ActionHash> {
    const zi = await this.zomeProxy.zomeInfo();
    console.log({zi});
    const di = await this.zomeProxy.dnaInfo();
    console.log({di});
    let ah;
    if (canBlock) {
      ah = await this.zomeProxy.createBlockingInteger(value);
    } else {
      ah = await this.zomeProxy.createInteger(value);
    }
    /** Add directly to perspective */
    this._values.push(value);
    this._knowns.push(ah);
    this.notifySubscribers();
    return ah;
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


  /** Methods */

  zvmChanged(zvm: ZomeViewModel): void {
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

