import {html} from "lit";
import {DummyZomePerspective, DummyZvm} from "../viewModels/dummy";
import {ZomeElement} from "@ddd-qc/dna-client";


/**
 *
 */
export class DummyList extends ZomeElement<DummyZomePerspective, DummyZvm> {

  constructor() {
    super(DummyZvm)
  }

  /** */
  async onProbe(e: any) {
    await this._zvm.probeAll();
  }


  /** */
  async onCreateDummy(e: any) {
    const input = this.shadowRoot!.getElementById("dummyInput") as HTMLInputElement;
    const value = Number(input.value);
    let res = await this._zvm.createDummy(value);
    //console.log("onCreateDummy() res =", serializeHash(res))
    input.value = "";
  }


  /** */
  render() {
    //console.log("<dummy-list> render()", this.cellData)
    if (!this._loaded) {
      return html`<span>Loading...</span>`;
    }
    console.log("dummy-list:", this._zvm.perspective.values)

    const dummyLi = Object.values(this.perspective.values).map(
      (value) => {
        return html`<li>${value}</li>`
      }
    );

    /** render all */
    return html`
        <h3>Dummy List <input type="button" value="Probe" @click=${this.onProbe}></h3>
        <label for="dummyInput">New dummy:</label>
        <input type="number" id="dummyInput" name="Value">
        <input type="button" value="create" @click=${this.onCreateDummy}>
      <ul>
          ${dummyLi}
      </ul>
    `

  }
}

