import {ContextProvider, createContext} from '@lit-labs/context';
import {LitElement, html} from "lit";
import {state, property} from "lit/decorators.js";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {InstalledCell} from "@holochain/client";


export const cellContext = createContext<InstalledCell>('cell');

export class CellContext extends ScopedElementsMixin(LitElement) {

  @property({type: Object})
  cellDef!: InstalledCell;

  // create a provider controller and a default logger
  private _provider = new ContextProvider(this, cellContext, this.cellDef);

  /** */
  firstUpdated() {
    this._provider.setValue(this.cellDef);
  }

  // createRenderRoot() {
  //   return this;
  // }


  /** */
  render() {
    console.log("CellContext Render()", this.cellDef)

    //this._provider.setValue(this.cellData);
    //return html``;
    return html`<slot></slot>`;
  }
}
