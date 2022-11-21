import {LitElement, html} from "lit";
import {state, property} from "lit/decorators.js";
import {ContextConsumer, contextProvided, createContext} from "@lit-labs/context";
import {RealZomePerspective, RealZvm} from "../viewModels/real";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {serializeHash} from "@holochain-open-dev/utils";
import {DummyZvm} from "../viewModels/dummy";
import {cellContext} from "./cell-context";
import {InstalledCell} from "@holochain/client";


export class RealList extends ScopedElementsMixin(LitElement) {

  @state() private _loaded = false;

  @contextProvided({ context: cellContext, subscribe: true })
  @property({type: Object})
  cellData!: InstalledCell;

  //@contextProvided({ context: RealZvm.context, subscribe: true })
  _zvm!: RealZvm;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: RealZomePerspective;


  /** */
  async firstUpdated() {
    new ContextConsumer(
      this,
      createContext<RealZvm>('zvm/real/' + serializeHash(this.cellData.cell_id[0])),
      (value: RealZvm, dispose?: () => void): void => {
        //console.log("DummyList.init()", this, value)
        this._zvm = value;
        this._zvm.subscribe(this, 'perspective');
        this._loaded = true;
      },
      false, // true will call twice at init
    );
    /* Done */
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
    console.log("<real-list> render()", this.cellData)
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

