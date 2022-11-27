import {LitElement} from "lit";
import { state } from "lit/decorators.js";
import {ConductorAppProxy} from "./ConductorAppProxy";
import {HappViewModel} from "./HappViewModel";
import { HvmDef } from "./definitions";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";



/**
 *
 */
export class HappElement extends ScopedElementsMixin(LitElement) {


  static HVM_DEF: HvmDef;


  conductorAppProxy!: ConductorAppProxy;
  hvm!: HappViewModel;

  protected constructor() {
    super();
    /* await */ this.initHapp();
  }

  /** */
  // static async new(port_or_socket: number | AppWebsocket, hvmDef: HvmDef): Promise<HappElement> {
  //   let happEl = new HappElement();
  //   happEl.conductorAppProxy = await ConductorAppProxy.new(port_or_socket);
  //   //happEl.hvm = await happEl.conductorAppProxy.newHappViewModel(happEl, happDef); // FIXME this can throw an error
  //   //await this._happ.probeAll();
  //   return happEl;
  // }


  /** */
  protected async initHapp() {
    this.conductorAppProxy = await ConductorAppProxy.new(Number(process.env.HC_PORT));
    const hvmDef = (this.constructor as typeof HappElement).HVM_DEF;
    if (!hvmDef) {
      throw Error("HVM_DEF static field undefined in HappElement subclass " + this.constructor.name);
    }
    this.hvm = await HappViewModel.new(this, this.conductorAppProxy, hvmDef);
    this.requestUpdate();
  }


  /** */
  shouldUpdate() {
    return !!this.hvm;
  }


  // /** */
  // async probeAll() {
  //   await this.hvm.probeAll();
  // }

}
