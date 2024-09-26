import { LitElement, html } from "lit";
import { state, property, customElement } from "lit/decorators.js";
import { DnaViewModel } from "../DnaViewModel";


/**
 *
 */
@customElement("dvm-inspect")
export class DvmInspect extends LitElement {

  /** -- Fields -- */
  @state() private _selectedZomeName = ""

  @property({ type: Object, attribute: false })
  dnaViewModel!: DnaViewModel;


  /** -- Methods -- */


  /** */
  async onZomeSelect(_e: any) {
    //console.log("onZomeSelect() CALLED", e)
    const zomeSelector = this.shadowRoot!.getElementById("selectedZome") as HTMLSelectElement;
    this._selectedZomeName = zomeSelector.value;
  }




  /** */
  override render() {
    const zomeOptions = this.dnaViewModel.zomeNames.map(
      (zomeName) => {
        return html`<option>${zomeName}</option>`
      }
    )

    let entryTypeOptions = null;
    let linkTypeOptions = null;
    let zfnOptions = null;
    if (this._selectedZomeName) {
      const zvm = this.dnaViewModel.getZomeViewModel(this._selectedZomeName)!;
      entryTypeOptions = zvm.zomeProxy.entryTypes.map(types => html`<option>${types}</option>`);
      linkTypeOptions = zvm.zomeProxy.linkTypes.map(types => html`<option>${types}</option>`);
      zfnOptions = zvm.zomeProxy.fnNames.map(([_zomeName, zfn]) => html`<option>${zfn}</option>`);

    }
    //console.log({entryTypeOptions})

    /** render all */
    return html`
        <span>Inspecting DNA <abbr title=${this.dnaViewModel.hcl}>${this.dnaViewModel.baseRoleName}</abbr>: </span>
        <span><abbr title=${this.dnaViewModel.cell.shareCode}>[shareCode]</abbr></span>
      <select name="selectedZome" id="selectedZome" @click=${this.onZomeSelect}>
          ${zomeOptions}
      </select>
      <div style="display: flex; flex-direction: row; gap: 5px;">
        <span>EntryTypes:</span>
        <select name="selectedEntryType" id="selectedEntryType">
            ${entryTypeOptions}
        </select>
        <span>LinkTypes:</span>
        <select name="selectedLinkType" id="selectedLinkType">
            ${linkTypeOptions}
        </select>
          <span>ZomeFunctions:</span>
          <select name="selectedZfn" id="selectedZfn">
              ${zfnOptions}
          </select>
      </div>
    `
  }
}
