import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {LitElement, html} from "lit";
import {property} from "lit/decorators.js";
import {InstalledCell} from "@holochain/client";
import {contextProvided} from "@lit-labs/context";
import {cellContext} from "./cell-context";

/**
 * LitElement that shows the cellContext as a <div>
 * Used for debugging
 */
export class ViewCellContext extends ScopedElementsMixin(LitElement) {

  @contextProvided({ context: cellContext, subscribe: true})
  @property({type: Object})
  installedCell!: InstalledCell;

  render() {
    const roleId = this.installedCell === undefined? "undefined" : this.installedCell.role_name;
    return html`
    <div>
        <span><b>(InstalledCell set to: "${roleId}")</b></span>
    </div>
    `;
  }
}
