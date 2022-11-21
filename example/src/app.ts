import { LitElement, html } from "lit";
import { state } from "lit/decorators.js";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { ConductorAppProxy, EntryDefSelect, HappDef, HappViewModel, IDnaViewModel, CellContext } from "@ddd-qc/dna-client";
import { DummyDvm } from "./viewModels/dummy";
import {RealDvm} from "./viewModels/real";
import { DummyList } from "./elements/dummy-list";
import {RealList} from "./elements/real-list";
import {LabelList} from "./elements/label-list";


/** */
export const PlaygroundHappDef: HappDef = {
  id: "playground",
  dvmDefs: [
    ["dummy_role", DummyDvm],
    ["impostor_role", DummyDvm],
    ["real_role", RealDvm],
  ]
}


/**
 *
 */
export class DummyApp extends ScopedElementsMixin(LitElement) {

  @state() private _loaded = false;
  @state() private _selectedZomeName = ""

  private _conductorAppProxy!: ConductorAppProxy;
  private _happ!: HappViewModel;

  //cellContext!: ContextKey<{__context__: string}, DnaHashB64>;



  get dummyDvm(): IDnaViewModel { return this._happ.getDvm("dummy_role")! }
  get impostorDvm(): IDnaViewModel { return this._happ.getDvm("impostor_role")! }
  get realDvm(): IDnaViewModel { return this._happ.getDvm("real_role")! }


  /** */
  async firstUpdated() {
    let HC_PORT = Number(process.env.HC_PORT);
    this._conductorAppProxy = await ConductorAppProxy.new(HC_PORT);
    this._happ = await this._conductorAppProxy.newHappViewModel(this, PlaygroundHappDef); // FIXME this can throw an error

    // this.cellContext = createContext<DnaHashB64>("dnaHash");
    // console.log({cellContext: this.cellContext})
    // this._provider = new ContextProvider(this, this.cellContext, this.dummyDvm.dnaHash);
    // console.log({provider: this._provider})

    //await dummyDvm.probeAll();
    //await dummyDvm.fetchAllEntryDefs();

    this._loaded = true;
  }


  /** */
  async onDumpLogs(e: any) {
    this.dummyDvm.dumpLogs()
  }


  /** */
  async onProbe(e: any) {
    //let entryDefs = await this.dummyDvm.fetchAllEntryDefs();
    //console.log({entryDefs})
    this._happ.probeAll();
  }


  /** */
  async onEntrySelect(e: any) {
    //console.log("onEntrySelect() CALLED", e)
    const label = this.shadowRoot!.getElementById("entryLabel") as HTMLElement;
    label.innerText = JSON.stringify(e.detail);
  }


  /** */
  render() {
    console.log("dummy-app render() called!")
    if (!this._loaded) {
      return html`<span>Loading...</span>`;
    }

    return html`
      <div style="margin:10px;">
        <h2>Playground App</h2>
        <input type="button" value="dump logs" @click=${this.onDumpLogs}>
        <input type="button" value="Probe hApp" @click=${this.onProbe}>
        <br/>
        <span>Select AppEntryType:</span>
        <entry-def-select .dnaViewModel="${this.dummyDvm}" @entrySelected=${this.onEntrySelect}></entry-def-select>
        <div style="margin:10px;">
            <span><span id="entryLabel">none</span></span>
        </div>
        <hr class="solid">
        <cell-context .cellData="${this.dummyDvm.cellData}">
          <h2>Dummy Cell: ${this.dummyDvm.dnaHash}</h2>
          <dummy-list></dummy-list>
          <label-list></label-list>
        </cell-context>
        <cell-context .cellData="${this.realDvm.cellData}">
          <hr class="solid">          
          <h2>Real Cell: ${this.realDvm.dnaHash}</h2>
          <real-list></real-list>
          <label-list></label-list>
        </cell-context>
        <cell-context .cellData="${this.impostorDvm.cellData}">
          <hr class="solid">          
          <h2>Impostor Cell: ${this.impostorDvm.dnaHash}</h2>
          <real-list></real-list>
          <label-list></label-list>
        </cell-context>
      </div>
    `
  }

  static get scopedElements() {
    return {
      "entry-def-select": EntryDefSelect,
      "dummy-list": DummyList,
      "real-list": RealList,
      "label-list": LabelList,
      "cell-context": CellContext,
    };
  }
}
