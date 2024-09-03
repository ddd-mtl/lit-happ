import {LitElement, html} from "lit";
import {property, customElement} from "lit/decorators.js";
import {consume} from "@lit/context";
import {Cell} from "@ddd-qc/cell-proxy";
import {cellMultiContext} from "./cell-multi-context";


/**
 * LitElement that shows the cellContext as a <div>
 * Used for debugging
 */
@customElement("view-cell-multi-context")
export class ViewCellMultiContext extends LitElement {

  @consume({ context: cellMultiContext, subscribe: true})
  @property()
  cells: Cell[] = []

  override render() {
    const cellNames: string[] =this.cells.map((cell) => "" + cell.name + ", ");
    return html`
    <div>
        <span><b>(Context has ${this.cells.length} cells: "${cellNames}")</b></span>
    </div>
    `;
  }
}
