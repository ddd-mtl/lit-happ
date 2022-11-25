import {html, ReactiveElement} from "lit";
import { state } from "lit/decorators.js";
import {ConductorAppProxy} from "./ConductorAppProxy";
import {HappDef, HappViewModel} from "./HappViewModel";
import {AppWebsocket} from "@holochain/client";


/**
 *
 */
export class HappElement extends ReactiveElement {

  private _conductorAppProxy!: ConductorAppProxy;
  private _happ!: HappViewModel;

  protected constructor() {super()}

  /** */
  static async new(port_or_socket: number | AppWebsocket, happDef: HappDef): Promise<HappElement> {
    let happEl = new HappElement();
    happEl._conductorAppProxy = await ConductorAppProxy.new(port_or_socket);
    happEl._happ = await happEl._conductorAppProxy.newHappViewModel(happEl, happDef); // FIXME this can throw an error
    //await this._happ.probeAll();
    return happEl;
  }


  /** */
  async probeAll(e: any) {
    await this._happ.probeAll();
  }

}
