import {LitElement, PropertyValues} from "lit";
import {property, state} from "lit/decorators.js";
import {ContextConsumer, consume, createContext} from "@lit/context";
import {DnaViewModel} from "./DnaViewModel";
import {BaseRoleName, Cell, CellsMixin, DnaId, DnaIdMap} from "@ddd-qc/cell-proxy";
import {RoleMixin} from "./roleMixin";
import {cellMultiContext} from "./elements/cell-multi-context";

/**
 * A LitElement that is bound to a specific DnaViewModel, e.g. a View for the ViewModel
 */
export class DnaMultiElement</*P,*/ DVM extends DnaViewModel> extends CellsMixin(RoleMixin(LitElement)) {

  /** if BaseRoleName is not provided, subclass must call requestDvm() in its Ctor */
  constructor(baseRoleName?: BaseRoleName) {
    super();
    if (baseRoleName) {
      this.baseRoleName = baseRoleName;
    }
  }

  /** Provided by Context depending on BaseRoleName */
  @state() protected _dvms:  DnaIdMap<DVM> = new DnaIdMap<DVM>();

  @consume({ context: cellMultiContext, subscribe: true})
  @property({attribute: false})
  _cells_via_context!: Cell[];

  // @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  // perspectives!: P[];

  private _consumers: DnaIdMap<any> = new DnaIdMap();


  /** -- Methods -- */

  /** */
  protected requestDvm(canRerequest: boolean = false) {
    /** Consume Context based on given dnaHash */
    if (!this._cells_via_context || this._cells_via_context.length == 0) {
      console.error("No Cells found via context in a DnaElement for role:", this.baseRoleName)
      return;
    }
    /* DVM already requested */
    if (!canRerequest && this._consumers.size > 0) {
      return;
    }
    for (const cell of this._cells!.values()) {
      const contextType = createContext<DVM>('dvm/' + cell.name);
      console.log(`\t\t Requesting context "${contextType}"`)
      const consumer = new ContextConsumer(
        this,
        contextType,
        async (newDvm: DVM, _dispose?: () => void): Promise<void> => {
          console.log(`\t\t Received value for context "${contextType}"`)
          const oldDvm = this._dvms.get(cell.address.dnaId);
          await this.dvmUpdated(cell.address.dnaId, newDvm, oldDvm);
          if (oldDvm) {
            oldDvm.unsubscribe(this);
          }
          this._dvms.set(cell.address.dnaId, newDvm);
          newDvm.subscribe(this, '');
        },
        false, // true will call twice at init
      );
      this._consumers.set(cell.address.dnaId, consumer);
      //console.log({consumer})
    }
  }


  /**
   * To be overriden by subclasses
   * Example: Have a subclass unsubscribe to oldDvm's zvms and subscribe to the new ones
   */
  protected async dvmUpdated(_cellAddress: DnaId, _newDvm: DVM, _oldDvm?: DVM): Promise<void> {
    //console.log(`\t\t Default dvmUpdated() called`)
  }


  /** */
  override shouldUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("_cells_via_context")) {
      this._cells = this._cells_via_context;
    }
    if (!this._dvms || this._dvms.size == 0) {
      this.requestDvm();
    }
    return (!!this._dvms && this._dvms.size > 0);
  }


  /** */
  protected override willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("_cells_via_context")) {
      this.requestDvm(true);
    }
  }
}
