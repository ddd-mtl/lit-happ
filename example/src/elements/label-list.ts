import {html} from "lit";
import {LabelZomePerspective, LabelZomeProxy, LabelZvm} from "../viewModels/label";
import {serializeHash} from "@holochain-open-dev/utils";
import {ZomeElement} from "@ddd-qc/dna-client";

/**
 *
 */
export class LabelList extends ZomeElement<LabelZomePerspective, LabelZvm> {

  constructor() {
    super(LabelZomePerspective.zomeName)
  }

  /** */
  async onProbe(e: any) {
    await this._zvm.probeAll();
  }


  /** */
  async onCreate(e: any) {
    const input = this.shadowRoot!.getElementById("dummyInput") as HTMLInputElement;
    let res = await this._zvm.createLabel(input.value);
    console.log("onCreate() res =", serializeHash(res))
    input.value = "";
  }


  /** */
  render() {
    //console.log("<label-list> render()", this.cellData, this._loaded)
    if (!this._loaded /*|| this.cellData*//*|| !this.perspective*/) {
      return html`<span>Loading...</span>`;
    }

    const dummyLi = Object.values(this.perspective.values).map(
      (value) => {
        return html`<li>${value}</li>`
      }
    );

    /** render all */
    return html`
        <h3>Label List <input type="button" value="Probe" @click=${this.onProbe}></h3>
        <label for="dummyInput">New label:</label>
        <input type="text" id="dummyInput" name="Value">
        <input type="button" value="create" @click=${this.onCreate}>
      <ul>
          ${dummyLi}
      </ul>
    `;

  }
}

