import {ContextProvider, createContext} from '@lit-labs/context';
import {LitElement, html, PropertyValues} from "lit";
import {property, state, customElement} from "lit/decorators.js";
import {Cell} from "@ddd-qc/cell-proxy";
import {DnaViewModel} from "../DnaViewModel";

export const cellContext = createContext<Cell>('lit-happ/cell');
//export const cellContext = createContext<Cell>('lit-happ/cell/default');


/**
 *
 */
@customElement("cell-context")
export class CellContext extends LitElement {

  @property({type: Object})
  cell!: Cell;

  @property({type: Object})
  dvm: DnaViewModel;

  /* create a provider controller */
  /*@state()*/ private _cellProvider = new ContextProvider(this, cellContext, this.cell);

  private _dnaProvider?;


  @state() private _initialized = false;



  /** */
  firstUpdated() {
    /** Cell */
    if (!this.cell) throw Error('"cell" property not defined in <cell-context>')
    //this._provider = new ContextProvider(this, cellContext, this.cell);
    this._cellProvider.setValue(this.cell);
    this._initialized = true;
    console.log(`\t Cell context set to "${this.cell.name}"`)

    /** DVM */
    if (this.dvm) {
      this._dnaProvider = new ContextProvider(this, this.dvm.getContext(), this.dvm);
    }
  }


  /** Set provider to cell */
  protected willUpdate(changedProperties: PropertyValues<this>) {
    //console.log("<cell-context>.willUpdate()", changedProperties)
    if (changedProperties.has("cell")) {
      //console.log("<cell-context>.willUpdate() changed installed cell", this.cell.name)
      this._cellProvider.setValue(this.cell);
      console.log(`\t Cell context changed to "${this.cell.name}"`)
    }

    if (changedProperties.has("dvm")) {
      this._dnaProvider = undefined;
      if (this.dvm) {
        this._dnaProvider = new ContextProvider(this, this.dvm.getContext(), this.dvm);
      }
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
