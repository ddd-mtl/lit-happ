import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {LitElement, PropertyValues} from "lit";
import {property, state} from "lit/decorators.js";
import {ContextConsumer, contextProvided, createContext} from "@lit-labs/context";
import {DnaViewModel} from "./DnaViewModel";
import {BaseRoleName, Cell, CellMixin} from "@ddd-qc/cell-proxy";
import {cellContext} from "./elements/cell-context";
import {RoleMixin} from "./roleMixin";

/**
 * A LitElement that is bound to a specific DnaViewModel, e.g. a View for the ViewModel
 */
export class DnaElement<P, DVM extends DnaViewModel> extends CellMixin(RoleMixin(ScopedElementsMixin(LitElement))) {

  /** if BaseRoleName is not provided, subclass must call requestDvm() in its Ctor */
  constructor(baseRoleName?: BaseRoleName) {
    super();
    if (baseRoleName) {
      this.baseRoleName = baseRoleName;
    }
  }

  /** Provided by Context depending on BaseRoleName */
  @state() protected _dvm!: DVM;

  @contextProvided({ context: cellContext, subscribe: true})
  @property({type: Object, attribute: false})
  _cell_via_context!: Cell;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: P;


  /** -- Methods -- */

  /** */
  protected requestDvm() {
    /** Consume Context based on given dnaHash */
    if (!this._cell_via_context) {
      console.error("No Cell info found via context in a DnaElement for role", this.baseRoleName)
      return;
    }
    const contextType = createContext<DVM>('dvm/'+ this.cell.name);
    console.log(`\t\t Requesting context "${contextType}"`)
    /*const consumer =*/ new ContextConsumer(
      this,
      contextType,
      (value: DVM, dispose?: () => void): void => {
        console.log(`\t\t Received value for context "${contextType}"`)
        this.dvmUpdated(value, this._dvm);
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
  protected async dvmUpdated(newDvm: DVM, oldDvm?: DVM): Promise<void> {
    //console.log(`\t\t Default dvmUpdated() called`)
  }


  /** */
  shouldUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("_cell_via_context")) {
      this._cell = this._cell_via_context;
    }
    if (!this._dvm) {
      this.requestDvm();
    }
    return !!this._dvm;
  }


  /** */
  protected willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("_cell_via_context")) {
      this.requestDvm();
    }
  }
}
