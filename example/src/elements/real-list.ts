import {html} from "lit";
import {RealZomePerspective, RealZomeProxy, RealZvm} from "../viewModels/real";
import {serializeHash} from "@holochain-open-dev/utils";
import { ZomeElement } from "@ddd-qc/dna-client";

/**
 *
 */
export class RealList extends ZomeElement<RealZomePerspective, RealZvm> {

  constructor() {
    super(RealZomeProxy.DEFAULT_ZOME_NAME)
  }

  /** */
  async onProbe(e: any) {
    await this._zvm.probeAll();
  }


  /** */
  async onCreate(e: any) {
    const input = this.shadowRoot!.getElementById("dummyInput") as HTMLInputElement;
    const value = Number(input.value);
    let res = await this._zvm.createReal(value);
    console.log("onCreate() res =", serializeHash(res))
    input.value = "";
  }


  /** */
  render() {
    //console.log("<real-list> render()", this._zvm)
    //console.log("real-list:", this.perspective.floats)

    const dummyLi = Object.values(this.perspective.floats).map(
      (value) => {
        return html`<li>${value}</li>`
      }
    );

    /** render all */
    return html`
        <h3>Real List <input type="button" value="Probe" @click=${this.onProbe}></h3>
        <label for="dummyInput">New real:</label>
        <input type="number" id="dummyInput" name="Value">
        <input type="button" value="create" @click=${this.onCreate}>
      <ul>
          ${dummyLi}
      </ul>
    `

  }
}

