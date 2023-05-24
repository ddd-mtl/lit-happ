import {ContextProvider, createContext} from '@lit-labs/context';
import {LitElement, html, PropertyValues} from "lit";
import {property, state, customElement} from "lit/decorators.js";
import {Cell} from "@ddd-qc/cell-proxy";

export const cellContext = createContext<Cell>('lit-happ/cell');

/**
 *
 */
@customElement("cell-context")
export class CellContext extends LitElement {

  @property({type: Object})
  cell!: Cell;

  /* create a provider controller */
  /*@state()*/ private _provider = new ContextProvider(this, cellContext, this.cell);

  @state() private _initialized = false;

  /** */
  firstUpdated() {
    if (!this.cell) throw Error('"cell" property not defined in <cell-context>')
    //this._provider = new ContextProvider(this, cellContext, this.cell);
    this._provider.setValue(this.cell);
    this._initialized = true;
    console.log(`\t Cell context set to "${this.cell.name}"`)
  }


  /** Set provider to cell */
  protected willUpdate(changedProperties: PropertyValues<this>) {
    //console.log("<cell-context>.willUpdate()", changedProperties)
    if (changedProperties.has("cell")) {
      //console.log("<cell-context>.willUpdate() changed installed cell", this.cell.name)
      this._provider.setValue(this.cell);
      console.log(`\t Cell context changed to "${this.cell.name}"`)
    }
  }


  /** */
  render() {
    if (!this._initialized) {
      return html``;
    }
    return html`<slot></slot>`;
  }
}
