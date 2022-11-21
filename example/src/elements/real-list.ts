import {LitElement, html} from "lit";
import {state, property} from "lit/decorators.js";
import {contextProvided} from "@lit-labs/context";
import {RealZomePerspective, RealZvm} from "../viewModels/real";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {serializeHash} from "@holochain-open-dev/utils";


export class RealList extends ScopedElementsMixin(LitElement) {

  @state() private _loaded = false;

  @contextProvided({ context: RealZvm.context, subscribe: true })
  _zvm!: RealZvm;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: RealZomePerspective;


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
    const value = Number(input.value);
    let res = await this._zvm.createReal(value);
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
        <h3>Real List <input type="button" value="Probe" @click=${this.onProbe}></h3>
        <label for="dummyInput">New real:</label>
        <input type="number" id="dummyInput" name="Value">
        <input type="button" value="create" @click=${this.onCreate}>
      <ul>
          ${dummyLi}
      </ul>
    `

  }
}

