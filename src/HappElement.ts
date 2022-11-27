import {LitElement} from "lit";
import { state } from "lit/decorators.js";
import {ConductorAppProxy} from "./ConductorAppProxy";
import {HappViewModel} from "./HappViewModel";
import { HvmDef } from "./definitions";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { AppWebsocket } from "@holochain/client";



/**
 *
 */
export class HappElement extends ScopedElementsMixin(LitElement) {

  /** Must be defined by subclass */
  static HVM_DEF: HvmDef;

  conductorAppProxy!: ConductorAppProxy;
  hvm!: HappViewModel;

  /** Ctor */
  protected constructor(port_or_socket: number | AppWebsocket) {
    super();
    /* await */ this.initHapp(port_or_socket);
  }


  /** */
  protected async initHapp(port_or_socket: number | AppWebsocket): Promise<void> {
    this.conductorAppProxy = await ConductorAppProxy.new(port_or_socket);
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
