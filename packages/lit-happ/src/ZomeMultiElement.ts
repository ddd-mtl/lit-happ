import {LitElement, PropertyValues} from "lit";
import {property, state} from "lit/decorators.js";
import {consume, ContextConsumer, createContext} from "@lit/context";
import {ZomeName} from "@holochain/client";
import { ZomeViewModel } from "./ZomeViewModel";
import {Cell, CellsMixin, DnaId, DnaIdMap} from "@ddd-qc/cell-proxy";
import {cellMultiContext} from "./elements/cell-multi-context";


/**
 * LitElement that is bound to a specific ZomeViewModel, e.g. a View for the ViewModel
 */
export class ZomeMultiElement<ZVM extends ZomeViewModel> extends CellsMixin(LitElement) {

  constructor(public readonly defaultZomeName: ZomeName) {
    super();
  }

  @consume({ context: cellMultiContext, subscribe: true})
  @property({attribute: false})
  _cells_via_context!: Cell[];

  protected _zomeName!: ZomeName;
  get zomeName(): ZomeName {return this._zomeName};

  /** Provided by Context depending on cellData.dnaHash */
  @state() protected _zvms: DnaIdMap<ZVM> = new DnaIdMap<ZVM>();


  private _consumers: DnaIdMap<any> = new DnaIdMap();


  /** -- Methods -- */

  /** Request zvm from Context based on current cells */
  private requestZvm(canRerequest: boolean = false) {
    if (!this._cells_via_context || this._cells_via_context.length == 0) {
      throw Error(`Context "${cellMultiContext}" not found from ZomeElement "${this.constructor.name}"`)
    }
    /* DVM already requested */
    if (!canRerequest && this._consumers.size > 0) {
      return;
    }
    for (const cell of this._cells!.values()) {
      const contextType = createContext<ZVM>('zvm/' + this.defaultZomeName + '/' + cell.address.dnaId.b64)
      console.log(`\t\t Requesting context "${contextType}"`)
      const consumer = new ContextConsumer(
        this,
        contextType,
        async (newZvm: ZVM, _dispose?: () => void): Promise<void> => {
          console.log(`\t\t Received value for context "${contextType}"`);
          const oldZvm = this._zvms.get(cell.address.dnaId);
          await this.zvmUpdated(cell.address.dnaId, newZvm, oldZvm);
          if (oldZvm) {
            oldZvm.unsubscribe(this);
          }
          this._zvms.set(cell.address.dnaId, newZvm);
          this._zomeName = newZvm.zomeName;
          newZvm.subscribe(this, 'perspective');
        },
        false, // true will call twice at init
      );
      this._consumers.set(cell.address.dnaId, consumer);
    }
  }


  /** Subclass can override this to get notified when a new ZVM has been received */
  protected async zvmUpdated(_cellAddress: DnaId, _newZvms: ZVM, _oldZvms?: ZVM): Promise<void> {
    //console.log(`\t\t Default zvmUpdated() called`)
  }


  /** */
  override shouldUpdate(changedProperties: PropertyValues<this>) {
    //console.log("ZomeElement.shouldUpdate() start", !!this._zvm, this.installedCell);
    if (changedProperties.has("_cells_via_context")) {
      //console.log("ZomeElement.shouldUpdate()", this._cell_via_context)
      this._cells = this._cells_via_context;
      this.requestZvm(true);
      return false;
    }
    /** RequestZvm on first "shouldUpdate" */
    if (!this._zvms || this._zvms.size == 0) {
      this.requestZvm();
    }
    return (!!this._zvms && this._zvms.size > 0);
  }


  // /** Request ZVM if cell changed */
  // protected willUpdate(changedProperties: PropertyValues<this>) {
  //   //console.log("ZomeElement.willUpdate()", changedProperties)
  //   if (changedProperties.has("_cell_via_context")) {
  //     this.requestZvm();
  //   }
  // }

}

