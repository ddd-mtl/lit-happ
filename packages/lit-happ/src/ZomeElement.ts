import {LitElement, PropertyValues} from "lit";
import {property, state} from "lit/decorators.js";
import {consume, ContextConsumer, createContext} from "@lit/context";
import {ZomeName} from "@holochain/client";
import {cellContext} from "./elements/cell-context";
import { ZomeViewModel } from "./ZomeViewModel";
import {Cell, CellMixin} from "@ddd-qc/cell-proxy";


/**
 * LitElement that is bound to a specific ZomeViewModel, e.g. a View for the ViewModel
 */
export class ZomeElement<P, ZVM extends ZomeViewModel> extends CellMixin(LitElement) {

  constructor(public readonly defaultZomeName: ZomeName) {
    super();
    // const nameAttr = this.getAttribute("zomeName");
    // if (nameAttr) {
    //   this.zomeName = nameAttr;
    // }
  }

  @consume({ context: cellContext, subscribe: true})
  @property({type: Object, attribute: false})
  _cell_via_context!: Cell;

  protected _zomeName!: ZomeName;
  get zomeName(): ZomeName {return this._zomeName};

  /** Provided by Context depending on cellData.dnaHash */
  @state() protected _zvm!: ZVM;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: P;


  /** -- Methods -- */

  /** Request zvm from Context based on current CellId */
  private requestZvm() {
    if (!this._cell_via_context) {
      throw Error(`Context "${cellContext}" not found from ZomeElement "${this.constructor.name}"`)
    }
    const contextType = createContext<ZVM>('zvm/'+ this.defaultZomeName + '/' + this.cell.dnaHash)
    console.log(`\t\t Requesting context "${contextType}"`)
    /*const consumer =*/ new ContextConsumer(
      this,
      contextType,
      async (value: ZVM, dispose?: () => void): Promise<void> => {
        console.log(`\t\t Received value for context "${contextType}"`)
        await this.zvmUpdated(value, this._zvm);
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


  /** Subclass can override this to get notified when a new ZVM has been received */
  protected async zvmUpdated(newZvm: ZVM, oldZvm?: ZVM): Promise<void> {
    //console.log(`\t\t Default zvmUpdated() called`)
  }


  /** */
  shouldUpdate(changedProperties: PropertyValues<this>) {
    //console.log("ZomeElement.shouldUpdate() start", !!this._zvm, this.installedCell);
    if (changedProperties.has("_cell_via_context")) {
      //console.log("ZomeElement.shouldUpdate()", this._cell_via_context)
      this._cell = this._cell_via_context;
      this.requestZvm();
      return false;
    }
    /** RequestZvm on first "shouldUpdate" */
    if (!this._zvm) {
      this.requestZvm();
    }
    return !!this._zvm;
  }


  // /** Request ZVM if cell changed */
  // protected willUpdate(changedProperties: PropertyValues<this>) {
  //   //console.log("ZomeElement.willUpdate()", changedProperties)
  //   if (changedProperties.has("_cell_via_context")) {
  //     this.requestZvm();
  //   }
  // }

}

