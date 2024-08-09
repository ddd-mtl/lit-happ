import {html} from "lit";
import {RealZomePerspective, RealZvm} from "../viewModels/real";
import {ZomeElement} from "@ddd-qc/lit-happ";
import {customElement} from "lit/decorators.js";

/**
 *
 */
@customElement("real-list")
export class RealList extends ZomeElement<RealZomePerspective, RealZvm> {

  constructor() {
    super(RealZvm.DEFAULT_ZOME_NAME)
  }

  /** */
  async onProbe(_e: any) {
    await this._zvm.probeAll();
  }


  /** */
  async onCreate(_e: any) {
    const input = this.shadowRoot!.getElementById("realInput") as HTMLInputElement;
    const value = Number(input.value);
    let res = await this._zvm.createReal(value);
    console.log("onCreate() res =", res)
    input.value = "";
  }


  /** */
  override render() {
    console.log(`<label-list> render(): ${this.cell.print()}`);

    //console.log("real-list:", this.perspective.floats)

    const realLi = Object.values(this.perspective.floats).map(
      (value) => {
        return html`<li>${value}</li>`
      }
    );

    /** render all */
    return html`
        <h3>Real List <input type="button" value="Probe" @click=${this.onProbe}></h3>
        <label for="realInput">New real:</label>
        <input type="number" id="realInput" name="Value">
        <input type="button" value="create" @click=${this.onCreate}>
      <ul>
          ${realLi}
      </ul>
    `

  }
}

