import {LitElement, html} from "lit";
import { state } from "lit/decorators.js";
import {ConductorAppProxy, EntryDefSelect, HappController, IDnaViewModel} from "@ddd-qc/dna-client";
import {DummyDvm, DummyZvm} from "./dummy";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";


/**
 *
 */
export class DummyApp extends ScopedElementsMixin(LitElement) {

  @state() private _loaded = false;
  @state() private _selectedZomeName = ""

  private _conductorAppProxy!: ConductorAppProxy;
  private _happ!: HappController;
  private _dnaRoleId!: string;

  get dummyDvm(): IDnaViewModel {return this._happ.getDvm(this._dnaRoleId)!}

  
  /** */
  async firstUpdated() {
    let HC_PORT = Number(process.env.HC_PORT);
    this._conductorAppProxy = await ConductorAppProxy.new(HC_PORT);
    this._happ = await this._conductorAppProxy.newHappElement(this, "playground")
    const dummyDvm = await DummyDvm.new(this._happ);
    this._dnaRoleId = await dummyDvm.roleId;
    this._happ.addDvm(dummyDvm);
    this.addController(this._happ);
    //await dummyDvm.probeAll();
    //await dummyDvm.fetchAllEntryDefs();
    this._loaded = true;
  }


  /** */  
  async onDumpLogs(e: any) {
    this.dummyDvm.dumpLogs()
  }


  /** */
  async onRefresh(e: any) {
    let entryDefs = await this.dummyDvm.fetchAllEntryDefs();
    //console.log({entryDefs})
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
        <h2>Dummy App</h2>
        <input type="button" value="dump logs" @click=${this.onDumpLogs}>
        <input type="button" value="refresh" @click=${this.onRefresh}>
        <br/>
        <span>Select AppEntryType:</span>
        <entry-def-select .dnaViewModel="${this.dummyDvm}" @entrySelected=${this.onEntrySelect}></entry-def-select>
        <div style="margin:10px;">
        <span><span id="entryLabel">none</span></span>
        </div>
      </div>
    `
  }

  static get scopedElements() {
    return {
      "entry-def-select": EntryDefSelect,
    };
  }
}
