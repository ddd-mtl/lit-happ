import {LitElement, html} from "lit";
import {state, property} from "lit/decorators.js";
import {ContextConsumer, contextProvided, createContext} from "@lit-labs/context";
import {LabelZomePerspective, LabelZvm} from "../viewModels/label";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {serializeHash} from "@holochain-open-dev/utils";
import {InstalledCell} from "@holochain/client";
import { cellContext } from "@ddd-qc/dna-client";


export class LabelList extends ScopedElementsMixin(LitElement) {

  @state() private _loaded = false;

  // @property()
  // dnaHash!: DnaHashB64;

  @contextProvided({ context: cellContext, subscribe: true })
  @property({type: Object})
  cellData!: InstalledCell;


  /** Provided by Context depending on cellData.dnaHash */
  _zvm!:LabelZvm;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: LabelZomePerspective;


  /** */
  async firstUpdated() {
    //console.log("LabelList firstUpdated()", serializeHash(this.cellData?.cell_id[0]))
    /** Consume Context based on given dnaHash */
    /*const consumer =*/ new ContextConsumer(
      this,
      createContext<LabelZvm>('zvm/label/' + serializeHash(this.cellData.cell_id[0])),
      (value: LabelZvm, dispose?: () => void): void => {
      //console.log("LabelList.init()", this, value)
      this._zvm = value;
      this._zvm.subscribe(this, 'perspective');
      this._loaded = true;
    },
      false, // true will call twice at init
    );
    //console.log({consumer})
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
    //console.log("<label-list> render()", this.cellData, this._loaded)
    if (!this._loaded /*|| this.cellData*//*|| !this.perspective*/) {
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
    `;

  }
}

