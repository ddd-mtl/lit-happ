import {LitElement, html} from "lit";
import {state, property} from "lit/decorators.js";
import {ContextConsumer, contextProvided, createContext} from "@lit-labs/context";
import {DummyZomePerspective, DummyZvm} from "../viewModels/dummy";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {serializeHash} from "@holochain-open-dev/utils";
import {cellContext} from "./cell-context";
import {InstalledCell} from "@holochain/client";


export class DummyList extends ScopedElementsMixin(LitElement) {

  @state() private _loaded = false;

  @contextProvided({ context: cellContext, subscribe: true })
  @property({type: Object})
  cellData!: InstalledCell;

  //@contextProvided({ context: DummyZvm.context, subscribe: true })
  _dummyZvm!: DummyZvm;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  dummyPerspective!: DummyZomePerspective;


  /** */
  async firstUpdated() {
    //console.log("DummyList firstUpdated()", serializeHash(this.cellData.cell_id[0]))
    new ContextConsumer(
      this,
      createContext<DummyZvm>('zvm/dummy/' + serializeHash(this.cellData.cell_id[0])),
      (value: DummyZvm, dispose?: () => void): void => {
        //console.log("DummyList.init()", this, value)
        this._dummyZvm = value;
        this._dummyZvm.subscribe(this, 'dummyPerspective');
        this._loaded = true;
      },
      false, // true will call twice at init
    );
    /* Done */
    this._loaded = true;
  }


  /** */
  async onProbe(e: any) {
    await this._dummyZvm.probeAll();
  }


  /** */
  async onCreateDummy(e: any) {
    const input = this.shadowRoot!.getElementById("dummyInput") as HTMLInputElement;
    const value = Number(input.value);
    let res = await this._dummyZvm.createDummy(value);
    //console.log("onCreateDummy() res =", serializeHash(res))
    input.value = "";
  }


  /** */
  render() {
    //console.log("<dummy-list> render()", this.cellData)
    if (!this._loaded) {
      return html`<span>Loading...</span>`;
    }

    const dummyLi = Object.values(this.dummyPerspective.values).map(
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

