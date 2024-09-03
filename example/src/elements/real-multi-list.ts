import {html, TemplateResult} from "lit";
import {RealZvm} from "../viewModels/real";
import {ZomeMultiElement} from "@ddd-qc/lit-happ";
import {customElement} from "lit/decorators.js";

/**
 *
 */
@customElement("real-multi-list")
export class RealMultiList extends ZomeMultiElement<RealZvm> {

  constructor() {
    super(RealZvm.DEFAULT_ZOME_NAME)
  }

  /** */
  async onProbe(_e: any) {
    await this._zvms.forEach((zvm) => zvm.probeAll());
  }


  // /** */
  // async onCreate(_e: any) {
  //   const input = this.shadowRoot!.getElementById("realInput") as HTMLInputElement;
  //   const value = Number(input.value);
  //   let res = await this._zvm.createReal(value);
  //   console.log("onCreate() res =", res)
  //   input.value = "";
  // }


  /** */
  override render() {
    console.log(`<label-list> render(): ${this.cell.print()}`);

    //console.log("real-list:", this.perspective.floats)
    const li: TemplateResult<1>[] = [];
    for (const zvm of this._zvms.values()) {
      const items = Object.values(zvm.perspective.floats).map((value) => html`<li>${value}</li>`);
      li.push(...items);
    }

    /** render all */
    return html`
        <h3>Real Multi List <input type="button" value="Probe" @click=${this.onProbe}></h3>
        <label for="realInput">New real:</label>
        <input type="number" id="realInput" name="Value">
      <ul>
          ${li}
      </ul>
    `

  }
}

