import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {LitElement} from "lit";
import {property, state} from "lit/decorators.js";
import {ContextConsumer, contextProvided, createContext} from "@lit-labs/context";
import {CellId, InstalledCell, RoleId, ZomeName} from "@holochain/client";
import {serializeHash} from "@holochain-open-dev/utils";
import {cellContext} from "./elements/cell-context";
import {IZome} from "./CellDef";
import {AgentPubKeyB64, DnaHashB64} from "@holochain-open-dev/core-types";
import { ZomeViewModel } from "./ZomeViewModel";


/**
 * LitElement that is bound to a specific ZomeViewModel, e.g. a View for the ViewModel
 */
export class ZomeElement<P, ZVM extends ZomeViewModel> extends ScopedElementsMixin(LitElement) implements IZome {

  constructor(public readonly zomeName: ZomeName) {
    super();
  }

  @contextProvided({ context: cellContext, subscribe: true})
  @property({type: Object})
  installedCell!: InstalledCell;

  /** Provided by Context depending on cellData.dnaHash */
  protected _zvm!: ZVM;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: P;

  /** CellDef interface */
  get roleId(): RoleId { return this.installedCell.role_id }
  get cellId(): CellId { return this.installedCell.cell_id }
  get dnaHash(): DnaHashB64 { return serializeHash(this.installedCell.cell_id[0]) }
  get agentPubKey(): AgentPubKeyB64 { return serializeHash(this.installedCell.cell_id[1]) }


  /** -- Methods -- */

  /** Request zvm from Context based on current CellId */
  private requestZvm() {
    const contextType = createContext<ZVM>('zvm/'+ this.zomeName + '/' + this.dnaHash)
    console.log(`Requesting context "${contextType}"`)
    /*const consumer =*/ new ContextConsumer(
      this,
      contextType,
      (value: ZVM, dispose?: () => void): void => {
        this._zvm = value;
        this._zvm.subscribe(this, 'perspective');
      },
      false, // true will call twice at init
    );
  }


  /** RequestZvm on first "shouldUpdate" */
  shouldUpdate() {
    //console.log("ZomeElement.shouldUpdate() start", !!this._zvm, this.installedCell);
    if (!this._zvm) {
      this.requestZvm();
    }
    return !!this._zvm;
  }

}

