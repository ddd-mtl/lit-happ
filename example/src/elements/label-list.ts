import {LitElement, html} from "lit";
import {state, property} from "lit/decorators.js";
import {contextProvided} from "@lit-labs/context";
import {LabelZomePerspective, LabelZvm} from "../viewModels/label";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {serializeHash} from "@holochain-open-dev/utils";


export class LabelList extends ScopedElementsMixin(LitElement) {

  @state() private _loaded = false;

  @contextProvided({ context: LabelZvm.context, subscribe: true })
  _zvm!: LabelZvm;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: LabelZomePerspective;


  /** */
  async firstUpdated() {
    this._zvm.subscribe(this, 'perspective');
    this._loaded = true;
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
    console.log("<dummy-list> render()")
    if (!this._loaded) {
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
    `

  }
}

