import {LitElement, html} from "lit";
import { state } from "lit/decorators.js";
import {ConductorAppProxy, EntryDefSelect, HappController, IDnaViewModel} from "@ddd-qc/dna-client";
import {DummyDvm, DummyZvm} from "./dummy";



/**
 *
 */
export class DummyApp extends LitElement {

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
    await dummyDvm.probeAll();
    this._loaded = true;
  }

  async onDumpLogs(e: any) {
    this.dummyDvm.dumpLogs()
  }


  /** */
  async onEntrySelect(e: any) {
    console.log("onEntrySelect() CALLED", e)
    const label = this.shadowRoot!.getElementById("entryLabel") as HTMLElement;
    label.innerText = JSON.stringify(e);
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
      <entry-def-select .dnaViewModel="${this.dummyDvm}" @entrySelected=${this.onEntrySelect}></entry-def-select>
      <h3>Selected AppEntryType</h3>
      <span id="entryLabel"></span>>
    `
  }

  static get scopedElements() {
    return {
      "entry-def-select": EntryDefSelect,
    };
  }
}
