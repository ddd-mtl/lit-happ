import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {LitElement, PropertyValues} from "lit";
import {property, state} from "lit/decorators.js";
import {ContextConsumer, contextProvided, createContext} from "@lit-labs/context";
import {CellId, encodeHashToBase64, InstalledCell, ZomeName, AgentPubKeyB64, DnaHashB64, Cell} from "@holochain/client";
import {cellContext} from "./elements/cell-context";
import { ZomeViewModel } from "./ZomeViewModel";
import {CellMixin, ICell, RoleInstanceId} from "@ddd-qc/cell-proxy";


/**
 * LitElement that is bound to a specific ZomeViewModel, e.g. a View for the ViewModel
 */
export class ZomeElement<P, ZVM extends ZomeViewModel> extends CellMixin(ScopedElementsMixin(LitElement)) {

  constructor(public readonly defaultZomeName: ZomeName) {
    super();
    // const nameAttr = this.getAttribute("zomeName");
    // if (nameAttr) {
    //   this.zomeName = nameAttr;
    // }
  }

  @contextProvided({ context: cellContext, subscribe: true})
  @property({type: Object, attribute: false})
  _cell_via_context!: Cell;

  protected _zomeName!: ZomeName;
  get zomeName(): ZomeName {return this._zomeName};

  /** Provided by Context depending on cellData.dnaHash */
  @state() protected _zvm!: ZVM;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: P;

  // /** InstalledCell interface */
  // get roleInstanceId(): RoleInstanceId { return this._cell_via_context.name }
  // get cellId(): CellId { return this._cell_via_context.cell_id }
  // get dnaHash(): DnaHashB64 { return encodeHashToBase64(this._cell_via_context.cell_id[0]) }
  // get agentPubKey(): AgentPubKeyB64 { return encodeHashToBase64(this._cell_via_context.cell_id[1]) }
  //

  /** -- Methods -- */

  /** Request zvm from Context based on current CellId */
  private requestZvm() {
    if (!this._cell_via_context) {
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
    if (changedProperties.has("_cell_via_context")) {
      //console.log("ZomeElement.willUpdate() installedCell in this element", this)
      this._cell = this._cell_via_context;
      this.requestZvm();
    }
  }

}

