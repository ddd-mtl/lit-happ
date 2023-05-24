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
    super(IntegerZvm.DEFAULT_ZOME_NAME)
  }


  /** */
  async onProbe(e: any) {
    await this._zvm.probeAll();
  }



  protected async zvmUpdated(newZvm: IntegerZvm, oldZvm?: IntegerZvm): Promise<void> {
    console.log(`\t\t IntegerList zvmUpdated() called`)
  }



  /** */
  async onCreateInteger(e: any) {
    const input = this.shadowRoot!.getElementById("integerInput") as HTMLInputElement;
    const value = Number(input.value);
    let res = await this._zvm.createInteger(value);
    //console.log("onCreateDummy() res =", serializeHash(res))
    input.value = "";
  }


  /** */
  render() {
    console.log("<integer-list> render(): " + this.cell.print());

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

