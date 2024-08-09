import {LitElement, PropertyValues} from "lit";
import {property, state} from "lit/decorators.js";
import {ContextConsumer, consume, createContext} from "@lit/context";
import {DnaViewModel} from "./DnaViewModel";
import {BaseRoleName, Cell, CellMixin} from "@ddd-qc/cell-proxy";
import {cellContext} from "./elements/cell-context";
import {RoleMixin} from "./roleMixin";

/**
 * A LitElement that is bound to a specific DnaViewModel, e.g. a View for the ViewModel
 */
export class DnaElement<P, DVM extends DnaViewModel> extends CellMixin(RoleMixin(LitElement)) {

  /** if BaseRoleName is not provided, subclass must call requestDvm() in its Ctor */
  constructor(baseRoleName?: BaseRoleName) {
    super();
    if (baseRoleName) {
      this.baseRoleName = baseRoleName;
    }
  }

  /** Provided by Context depending on BaseRoleName */
  @state() protected _dvm!: DVM;

  @consume({ context: cellContext, subscribe: true})
  @property({type: Object, attribute: false})
  _cell_via_context!: Cell;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: P;

  // @ts-ignore
  private _consumer?;


  /** -- Methods -- */

  /** */
  protected requestDvm(canRerequest: boolean = false) {
    /** Consume Context based on given dnaHash */
    if (!this._cell_via_context) {
      console.error("No Cell info found via context in a DnaElement for role:", this.baseRoleName)
      return;
    }
    /* DVM already requested */
    if (!canRerequest && this._consumer) {
      return;
    }
    const contextType = createContext<DVM>('dvm/'+ this.cell.name);
    console.log(`\t\t Requesting context "${contextType}"`)
    this._consumer = new ContextConsumer(
      this,
      contextType,
      async (value: DVM, _dispose?: () => void): Promise<void> => {
        console.log(`\t\t Received value for context "${contextType}"`)
        await this.dvmUpdated(value, this._dvm);
        if (this._dvm) {
          this._dvm.unsubscribe(this);
        }
        this._dvm = value;
        this._dvm.subscribe(this, 'perspective');
      },
      false, // true will call twice at init
    );
    //console.log({consumer})
  }


  /**
   * To be overriden by subclasses
   * Example: Have a subclass unsubscribe to oldDvm's zvms and subscribe to the new ones
   */
  protected async dvmUpdated(_newDvm: DVM, _oldDvm?: DVM): Promise<void> {
    //console.log(`\t\t Default dvmUpdated() called`)
  }


  /** */
  override shouldUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("_cell_via_context")) {
      this._cell = this._cell_via_context;
    }
    if (!this._dvm) {
      this.requestDvm();
    }
    return !!this._dvm;
  }


  /** */
  protected override willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("_cell_via_context")) {
      this.requestDvm(true);
    }
  }
}
