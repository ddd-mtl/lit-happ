import {ContextProvider, createContext} from '@lit/context';
import {LitElement, html, PropertyValues} from "lit";
import {property, state, customElement} from "lit/decorators.js";
import {Cell} from "@ddd-qc/cell-proxy";
import {DnaViewModel} from "../DnaViewModel";

export const cellMultiContext = createContext<Cell[]>('lit-happ/cellMulti');
//export const cellContext = createContext<Cell>('lit-happ/cell/default');


/**
 *
 */
@customElement("cell-multi-context")
export class CellMultiContext extends LitElement {

  @property()
  cells: Cell[] = [];

  @property({type: Object})
  dvm: DnaViewModel | undefined = undefined;

  /* create a provider controller */
  /*@state()*/ private _cellProvider = new ContextProvider(this, cellMultiContext, this.cells);

  // @ts-ignore
  private _dnaProvider?;

  @state() private _initialized = false;


  /** -- Methods -- */

  /** */
  override firstUpdated() {
    /** Cell */
    if (!this.cells || this.cells.length == 0) {
      throw Error('No cells set by <cell-context>')
    }
    //this._provider = new ContextProvider(this, cellContext, this.cell);
    this._cellProvider.setValue(this.cells);
    this._initialized = true;
    console.log(`\t Cell context set:`, this.cells.map((cell) => cell.name))

    /** DVM */
    if (this.dvm) {
      this._dnaProvider = new ContextProvider(this, this.dvm.getContext(), this.dvm);
    }
  }


  /** Set provider to cell */
  protected override willUpdate(changedProperties: PropertyValues<this>) {
    //console.log("<cell-context>.willUpdate()", changedProperties)
    if (changedProperties.has("cells")) {
      //console.log("<cell-context>.willUpdate() changed installed cell", this.cell.name)
      this._cellProvider.setValue(this.cells);
      console.log(`\t Cell context changed:`, this.cells.map((cell) => cell.name))
    }

    if (changedProperties.has("dvm")) {
      this._dnaProvider = undefined;
      if (this.dvm) {
        this._dnaProvider = new ContextProvider(this, this.dvm.getContext(), this.dvm);
      }
    }
  }


  /** */
  override render() {
    if (!this._initialized) {
      return html``;
    }
    return html`<slot></slot>`;
  }
}
