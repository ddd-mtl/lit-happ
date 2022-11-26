import {ContextProvider, createContext} from '@lit-labs/context';
import {LitElement, html} from "lit";
import {property} from "lit/decorators.js";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {InstalledCell} from "@holochain/client";


export const cellContext = createContext<InstalledCell>('cell');

export class CellContext extends ScopedElementsMixin(LitElement) {

  @property({type: Object})
  installedCell!: InstalledCell;

  /* create a provider controller */
  private _provider = new ContextProvider(this, cellContext, this.installedCell);

  /** */
  firstUpdated() {
    this._provider.setValue(this.installedCell);
  }

  /** */
  render() {
    console.log(`CellContext set "${this.installedCell.role_id}"`)
    return html`<slot></slot>`;
  }
}
