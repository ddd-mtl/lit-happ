import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {LitElement, html} from "lit";
import {property} from "lit/decorators.js";
import {contextProvided} from "@lit-labs/context";
import {cellContext} from "./cell-context";
import {Cell} from "@ddd-qc/cell-proxy";

/**
 * LitElement that shows the cellContext as a <div>
 * Used for debugging
 */
export class ViewCellContext extends ScopedElementsMixin(LitElement) {

  @contextProvided({ context: cellContext, subscribe: true})
  @property({type: Object})
  cell!: Cell;

  render() {
    const cellName = this.cell === undefined? "undefined" : this.cell.name;
    return html`
    <div>
        <span><b>(InstalledCell set to: "${cellName}")</b></span>
    </div>
    `;
  }
}
