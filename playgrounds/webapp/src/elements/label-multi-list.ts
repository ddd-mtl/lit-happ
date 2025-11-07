import {html} from "lit";
import {LabelZvm} from "../viewModels/label";
import {ZomeMultiElement} from "@ddd-qc/lit-happ";
import {customElement} from "lit/decorators.js";
import {TemplateResult} from "lit/development";


/**
 *
 */
@customElement("label-multi-list")
export class LabelMultiList extends ZomeMultiElement<LabelZvm> {

  constructor() {
    super(LabelZvm.DEFAULT_ZOME_NAME);
    console.log("<label-list>.ctor()")
  }

  /** */
  async onProbe(_e: any) {
    await this._zvms.forEach((zvm) => zvm.probeAll());
  }


  // /** */
  // async onCreate(_e: any) {
  //   const input = this.shadowRoot!.getElementById("labelInput") as HTMLInputElement;
  //   let res = await this._zvm.createLabel(input.value);
  //   console.log("onCreate() res =", res.short)
  //   input.value = "";
  // }


  /** */
  override render() {
    console.log(`<label-list>.render(): ${this.cell.print()}`);

    //console.log("label-list:", this.perspective.names)

    //console.log("real-list:", this.perspective.floats)
    const li: TemplateResult<1>[] = [];
    for (const zvm of this._zvms.values()) {
      const items = Object.values(zvm.perspective.names).map((value) => html`<li>${value}</li>`);
      li.push(...items);
    }

    /** render all */
    return html`
        <h3>Label List <input type="button" value="Probe" @click=${this.onProbe}></h3>
        <label for="labelInput">New label:</label>
        <input type="text" id="labelInput" name="Value">
      <ul>
          ${li}
      </ul>
    `;

  }
}

