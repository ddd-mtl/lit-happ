import {html, ReactiveElement} from "lit";
import { state } from "lit/decorators.js";
import {ConductorAppProxy} from "./ConductorAppProxy";
import {HappDef, HappViewModel} from "./HappViewModel";
import {AppWebsocket} from "@holochain/client";



/**
 *
 */
export class HappElement extends ReactiveElement {

  conductorAppProxy!: ConductorAppProxy;
  hvm!: HappViewModel;

  protected constructor() {super()}

  /** */
  static async new(port_or_socket: number | AppWebsocket, happDef: HappDef): Promise<HappElement> {
    let happEl = new HappElement();
    happEl.conductorAppProxy = await ConductorAppProxy.new(port_or_socket);
    happEl.hvm = await happEl.conductorAppProxy.newHappViewModel(happEl, happDef); // FIXME this can throw an error
    //await this._happ.probeAll();
    return happEl;
  }


  /** */
  async probeAll(e: any) {
    await this.hvm.probeAll();
  }

}
