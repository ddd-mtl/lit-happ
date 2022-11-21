import {LitElement, html} from "lit";
import {state, property} from "lit/decorators.js";
import {ContextConsumer, contextProvided, ContextType, createContext} from "@lit-labs/context";
import {LabelZomePerspective, LabelZvm} from "../viewModels/label";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {serializeHash} from "@holochain-open-dev/utils";
import {DnaHashB64} from "@holochain-open-dev/core-types";


export class LabelList extends ScopedElementsMixin(LitElement) {

  @state() private _loaded = false;

  @property()
  dnaHash!: DnaHashB64;

  // @contextProvided({ context: LabelZvm.context, subscribe: true })
  // _zvm!: LabelZvm;

  _zvm!:LabelZvm;
  _consumer!: any;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: LabelZomePerspective;


  /** Fixme called twice for unknown reason */
  async init(value: LabelZvm, dispose?: () => void): Promise<void> {
    let self = (this as any).host;
    console.log("LabelList.init()", self, value)
    self._zvm = value;
    self._zvm.subscribe(self, 'perspective');
    self._loaded = true;
  }

  /** */
  async firstUpdated() {
    console.log("LabelList firstUpdated()", this.dnaHash)
    this._consumer = new ContextConsumer(
      this,
      createContext<LabelZvm>('zvm/label/' + this.dnaHash),
      this.init,
      false//true
    );
    console.log({consumer: this._consumer})
    //this._loaded = true;
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
    console.log("<label-list> render()", this.dnaHash, this._loaded)
    if (!this._loaded /*|| !this.perspective*/) {
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

