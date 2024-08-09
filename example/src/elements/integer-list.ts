import {html} from "lit";
import {customElement} from "lit/decorators.js";
import {IntegerZomePerspective, IntegerZvm} from "../viewModels/integer";
import {ZomeElement} from "@ddd-qc/lit-happ";

/**
 *
 */
@customElement("integer-list")
export class IntegerList extends ZomeElement<IntegerZomePerspective, IntegerZvm> {

  /** */
  constructor() {
    console.log(`<integer-list>.ctor()`)
    super(IntegerZvm.DEFAULT_ZOME_NAME)
  }


  /** */
  async onProbe(_e: any) {
    console.log(`\t\t <integer-list>.onProbe()`)
    await this._zvm.probeAll();
  }



  protected override async zvmUpdated(_newZvm: IntegerZvm, _oldZvm?: IntegerZvm): Promise<void> {
    console.log(`\t\t <integer-list>.zvmUpdated()`)
  }



  /** */
  async onCreateInteger(_e: any) {
    const input = this.shadowRoot!.getElementById("integerInput") as HTMLInputElement;
    const value = Number(input.value);
    await this._zvm.createInteger(value, true);
    //console.log("onCreateDummy() res =", serializeHash(res))
    input.value = "";
  }


  /** */
  override render() {
    console.log("<integer-list>.render(): " + this.cell.print());

    //console.log("integer-list:", this.perspective.values)

    const integerLi = Object.values(this.perspective.values).map(
      (value) => {
        return html`<li>${value}</li>`
      }
    );

    /** render all */
    return html`
        <h3>Integer List <input type="button" value="Probe" @click=${this.onProbe}></h3>
        <label for="integerInput">New integer:</label>
        <input type="number" id="integerInput" name="Value">
        <input type="button" value="create" @click=${this.onCreateInteger}>
      <ul>
          ${integerLi}
      </ul>
    `

  }
}

