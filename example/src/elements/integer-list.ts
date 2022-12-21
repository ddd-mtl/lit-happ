import {html} from "lit";
import {IntegerZomePerspective, IntegerZvm} from "../viewModels/integer";
import {ZomeElement, printCell} from "@ddd-qc/lit-happ";

/**
 *
 */
export class IntegerList extends ZomeElement<IntegerZomePerspective, IntegerZvm> {

  /** */
  constructor() {
    super(IntegerZvm.DEFAULT_ZOME_NAME)
  }


  /** */
  async onProbe(e: any) {
    await this._zvm.probeAll();
  }



  protected async zvmUpdated(newDvm: IntegerZvm, oldDvm?: IntegerZvm): Promise<void> {
    console.log(`\t\t DummyList zvmUpdated() called`)
  }



  /** */
  async onCreateDummy(e: any) {
    const input = this.shadowRoot!.getElementById("dummyInput") as HTMLInputElement;
    const value = Number(input.value);
    let res = await this._zvm.createInteger(value);
    //console.log("onCreateDummy() res =", serializeHash(res))
    input.value = "";
  }


  /** */
  render() {
    console.log("<dummy-list> render(): " + printCell(this.cell));

    //console.log("dummy-list:", this.perspective.values)

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

