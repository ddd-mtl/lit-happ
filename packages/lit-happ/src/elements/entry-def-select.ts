import { LitElement, html } from "lit";
import { state, property, customElement } from "lit/decorators.js";
import { DnaViewModel } from "../DnaViewModel";
import {Dictionary, EntryDef} from "@ddd-qc/cell-proxy";


/**
 *
 */
@customElement("entry-def-select")
export class EntryDefSelect extends LitElement {

  /** -- Fields -- */
  @state() private _selectedZomeName = ""
  @state() private _allEntryDefs: Dictionary<Dictionary<EntryDef>> = {};

  @property({ type: Object, attribute: false })
  dnaViewModel!: DnaViewModel;


  /** -- Methods -- */

  override async firstUpdated() {
    this._allEntryDefs = await this.dnaViewModel.fetchAllEntryDefs()
  }

  /** */
  async onZomeSelect(_e: any) {
    //console.log("onZomeSelect() CALLED", e)
    const zomeSelector = this.shadowRoot!.getElementById("selectedZome") as HTMLSelectElement;
    this._selectedZomeName = zomeSelector.value;
  }

  /** */
  async onEntrySelect(_e: any) {
    // console.log("onEntrySelect() CALLED", e)
    const entrySelector = this.shadowRoot!.getElementById("selectedEntryType") as HTMLSelectElement;
    const options = {
      detail: { zome: this._selectedZomeName, entry: entrySelector.value },
      bubbles: true,
      composed: true
    };
    this.dispatchEvent(new CustomEvent('entrySelected', options));
  }


  /** */
  override render() {
    //console.log("<entry-def-select> render()", this.dnaViewModel)
    // if (!this.dnaViewModel) {
    //   return html`<span>Loading...</span>`;
    // }

    const zomeOptions = Object.entries(this._allEntryDefs).map(
      ([zomeName, _entryDef]) => {
        return html`<option>${zomeName}</option>`
      }
    )
    let zomeTypes = Object.entries(this._allEntryDefs)
      .filter((item) => { return item[0] == this._selectedZomeName; })
      .map((item) => { return item[1] });
    //console.log({zomeTypes})

    let entryTypeOptions = null;
    if (zomeTypes.length > 0) {
      entryTypeOptions = Object.entries(zomeTypes[0]!).map(
        ([_zomeName, entryDef]) => {
          let name = Object.keys(entryDef.id)[0];
          if ("App" in entryDef.id) {
            name = entryDef.id.App;
          }
          return html`<option>${name}</option>`;
        });
    }
    //console.log({entryTypeOptions})

    /** render all */
    return html`
      <select name="selectedZome" id="selectedZome" @click=${this.onZomeSelect}>
          ${zomeOptions}
      </select>
      <span>::</span>
      <select name="selectedEntryType" id="selectedEntryType" @click=${this.onEntrySelect}>
          ${entryTypeOptions}
      </select>
    `
  }
}
