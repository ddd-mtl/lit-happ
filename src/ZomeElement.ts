import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {LitElement} from "lit";
import {property, state} from "lit/decorators.js";
import {ContextConsumer, contextProvided, createContext} from "@lit-labs/context";
import {CellId, InstalledCell, RoleId} from "@holochain/client";
import {serializeHash} from "@holochain-open-dev/utils";
import {cellContext} from "./elements/cell-context";
import {ICellDef, ZomeSpecific, ZomeSpecificMixin} from "./CellDef";
import {AgentPubKeyB64, DnaHashB64} from "@holochain-open-dev/core-types";
import {IZomeViewModel} from "./ZomeViewModel";


/**
 * LitElement that is bound to a specific ZomeViewModel
 */
export class ZomeElement<P, ZVM extends IZomeViewModel> extends ZomeSpecificMixin(ScopedElementsMixin(LitElement)) implements ICellDef {

  constructor(zvm: typeof ZomeSpecific) {
    super();
    this.setZomeName(zvm.zomeName);
  }

  @contextProvided({ context: cellContext, subscribe: true})
  @property({type: Object})
  cellDef!: InstalledCell;

  /** Provided by Context depending on cellData.dnaHash */
  protected _zvm!: ZVM;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: P;

  /** CellDef interface */
  get roleId(): RoleId { return this.cellDef.role_id }
  get cellId(): CellId { return this.cellDef.cell_id }
  get dnaHash(): DnaHashB64 { return serializeHash(this.cellDef.cell_id[0]) }
  get agentPubKey(): AgentPubKeyB64 { return serializeHash(this.cellDef.cell_id[1]) }


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
    console.log("ZomeElement.shouldUpdate() start", !!this._zvm, this.cellDef);
    if (!this._zvm) {
      this.requestZvm();
    }
    console.log("ZomeElement.shouldUpdate() end", !!this._zvm);
    return !!this._zvm;
  }

}
