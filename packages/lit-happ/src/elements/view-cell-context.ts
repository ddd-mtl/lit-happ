import {LitElement, html} from "lit";
import {property, customElement} from "lit/decorators.js";
import {consume} from "@lit-labs/context";
import {cellContext} from "./cell-context";
import {Cell} from "@ddd-qc/cell-proxy";


/**
 * LitElement that shows the cellContext as a <div>
 * Used for debugging
 */
@customElement("view-cell-context")
export class ViewCellContext extends LitElement {

  @consume({ context: cellContext, subscribe: true})
  @property({type: Object})
  cell!: Cell;

  render() {
    const cellName = this.cell === undefined? "undefined" : this.cell.name;
    return html`
    <div>
        <span><b>(Cell set to: "${cellName}")</b></span>
    </div>
    `;
  }
}
