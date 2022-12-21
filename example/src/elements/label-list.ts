import {html} from "lit";
import {LabelZomePerspective, LabelZvm} from "../viewModels/label";
import {ZomeElement, printCell} from "@ddd-qc/lit-happ";
import {encodeHashToBase64} from "@holochain/client";


/**
 *
 */
export class LabelList extends ZomeElement<LabelZomePerspective, LabelZvm> {

  constructor() {
    super(LabelZvm.DEFAULT_ZOME_NAME);
    console.log("<label-list>.ctor()")
  }

  /** */
  async onProbe(e: any) {
    await this._zvm.probeAll();
  }


  /** */
  async onCreate(e: any) {
    const input = this.shadowRoot!.getElementById("labelInput") as HTMLInputElement;
    let res = await this._zvm.createLabel(input.value);
    console.log("onCreate() res =", encodeHashToBase64(res))
    input.value = "";
  }


  /** */
  render() {
    console.log(`<label-list> render(): ${printCell(this.cell)}`);

    //console.log("label-list:", this.perspective.names)

    const dummyLi = Object.values(this.perspective.names).map(
      (value) => {
        return html`<li>${value}</li>`
      }
    );

    /** render all */
    return html`
        <h3>Label List <input type="button" value="Probe" @click=${this.onProbe}></h3>
        <label for="labelInput">New label:</label>
        <input type="text" id="labelInput" name="Value">
        <input type="button" value="create" @click=${this.onCreate}>
      <ul>
          ${dummyLi}
      </ul>
    `;

  }
}

