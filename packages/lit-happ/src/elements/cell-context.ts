import {ContextProvider, createContext} from '@lit-labs/context';
import {LitElement, html, PropertyValues} from "lit";
import {property, state} from "lit/decorators.js";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {InstalledCell} from "@holochain/client";


export const cellContext = createContext<InstalledCell>('lit-happ/cell');

export class CellContext extends ScopedElementsMixin(LitElement) {

  @property({type: Object})
  installedCell!: InstalledCell;

  /* create a provider controller */
  /*@state()*/ private _provider = new ContextProvider(this, cellContext, this.installedCell);

  @state() private _initialized = false;

  /** */
  firstUpdated() {
    if (!this.installedCell) throw Error('"installedCell" property not defined in <cell-context>')
    //this._provider = new ContextProvider(this, cellContext, this.installedCell);
    this._provider.setValue(this.installedCell);
    this._initialized = true;
  }


  /** Set provider to installedCell */
  protected willUpdate(changedProperties: PropertyValues<this>) {
    //console.log("<cell-context>.willUpdate()", changedProperties)
    if (changedProperties.has("installedCell")) {
      //console.log("<cell-context>.willUpdate() changed installed cell", this.installedCell.role_id)
      this._provider.setValue(this.installedCell);
    }
  }


  /** */
  render() {
    if (!this._initialized) {
      return html``;
    }
    console.log(`Cell context set to "${this.installedCell.role_id}"`)
    return html`<slot></slot>`;
  }
}
