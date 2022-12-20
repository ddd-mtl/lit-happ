import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {LitElement, PropertyValues} from "lit";
import {property, state} from "lit/decorators.js";
import {ContextConsumer, contextProvided, createContext} from "@lit-labs/context";
import {CellId, InstalledCell, ZomeName} from "@holochain/client";
import {serializeHash} from "@holochain-open-dev/utils";
import {cellContext} from "./elements/cell-context";
import {AgentPubKeyB64, DnaHashB64} from "@holochain-open-dev/core-types";
import { ZomeViewModel } from "./ZomeViewModel";
import {IInstalledCell, RoleInstanceId} from "@ddd-qc/cell-proxy";


/**
 * LitElement that is bound to a specific ZomeViewModel, e.g. a View for the ViewModel
 */
export class ZomeElement<P, ZVM extends ZomeViewModel> extends ScopedElementsMixin(LitElement) implements IInstalledCell {

  constructor(public readonly defaultZomeName: ZomeName) {
    super();
    // const nameAttr = this.getAttribute("zomeName");
    // if (nameAttr) {
    //   this.zomeName = nameAttr;
    // }
  }

  @contextProvided({ context: cellContext, subscribe: true})
  @property({type: Object})
  installedCell!: InstalledCell;

  protected _zomeName!: ZomeName;
  get zomeName(): ZomeName {return this._zomeName};

  /** Provided by Context depending on cellData.dnaHash */
  @state() protected _zvm!: ZVM;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: P;

  /** InstalledCell interface */
  get roleInstanceId(): RoleInstanceId { return this.installedCell.role_id }
  get cellId(): CellId { return this.installedCell.cell_id }
  get dnaHash(): DnaHashB64 { return serializeHash(this.installedCell.cell_id[0]) }
  get agentPubKey(): AgentPubKeyB64 { return serializeHash(this.installedCell.cell_id[1]) }


  /** -- Methods -- */

  /** Request zvm from Context based on current CellId */
  private requestZvm() {
    if (!this.installedCell) {
      throw Error(`"installedCell" from context "${cellContext}" not found in ZomeElement "${this.constructor.name}"`)
    }
    const contextType = createContext<ZVM>('zvm/'+ this.defaultZomeName + '/' + this.dnaHash)
    console.log(`\t\t Requesting context "${contextType}"`)
    /*const consumer =*/ new ContextConsumer(
      this,
      contextType,
      (value: ZVM, dispose?: () => void): void => {
        console.log(`\t\t Received value for context "${contextType}"`)
        this.zvmUpdated(value, this._zvm);
        if (this._zvm) {
          this._zvm.unsubscribe(this);
        }
        this._zvm = value;
        this._zomeName = this._zvm.zomeName;
        this._zvm.subscribe(this, 'perspective');
      },
      false, // true will call twice at init
    );
  }


  /** To be overriden by subclasses */
  protected async zvmUpdated(newZvm: ZVM, oldZvm?: ZVM): Promise<void> {
    //console.log(`\t\t Default zvmUpdated() called`)
  }


  /** RequestZvm on first "shouldUpdate" */
  shouldUpdate(_changedProperties: PropertyValues<this>) {
    //console.log("ZomeElement.shouldUpdate() start", !!this._zvm, this.installedCell);
    if (!this._zvm) {
      this.requestZvm();
    }
    return !!this._zvm;
  }


  /** */
  protected willUpdate(changedProperties: PropertyValues<this>) {
    //console.log("ZomeElement.willUpdate()", changedProperties)
    if (changedProperties.has("installedCell")) {
      //console.log("ZomeElement.willUpdate() installedCell in this element", this)
      this.requestZvm();
    }
  }

}

