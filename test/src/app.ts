import { LitElement, html } from "lit";
import { state } from "lit/decorators.js";
import {DnaViewModel, EntryDefSelect} from "@ddd-qc/dna-client";
import {DummyViewModel} from "./dummy";



/**
 *
 */
export class DummyApp extends LitElement {

  @state() private _loaded = false;
  @state() private _selectedZomeName = ""

  private _dnaViewModel!: DnaViewModel;

  async firstUpdated() {
    let HC_PORT:any = process.env.HC_PORT;
    this._dnaViewModel = await DnaViewModel.new(this, HC_PORT, "playground");
    await this._dnaViewModel.addZomeViewModel(DummyViewModel)
    await this._dnaViewModel.probeAll();
    this._loaded = true;
  }

  async onDumpLogs(e: any) {
    this._dnaViewModel.dumpLogs()
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
      <entry-def-select .dnaViewModel="${this._dnaViewModel}" @entrySelected=${this.onEntrySelect}></entry-def-select>
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
