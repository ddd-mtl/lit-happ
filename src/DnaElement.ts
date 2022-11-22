import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {LitElement} from "lit";
import {property, state} from "lit/decorators.js";
import {ContextConsumer, createContext} from "@lit-labs/context";
import {DnaViewModel} from "./DnaViewModel";


/**
 * LitElement that is bound to a specific DnaViewModel
 */
export class DnaElement<P, DVM extends DnaViewModel<P>> extends ScopedElementsMixin(LitElement) {

  constructor(public dnaName: string) {
    super();
  }

  @state() protected _loaded = false;

  // @contextProvided({ context: cellContext, subscribe: true })
  // @property({type: Object})
  // cellData!: InstalledCell;

  //@contextProvided({ context: D.context, subscribe: true })
  /** Provided by Context depending on dnaName */
  protected _dvm!: DVM;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: P;

  /** */
  async firstUpdated() {
    //console.log("LabelList firstUpdated()", serializeHash(this.cellData?.cell_id[0]))
    /** Consume Context based on given dnaHash */
    /*const consumer =*/ new ContextConsumer(
      this,
      createContext<DVM>('dvm/'+ this.dnaName),
      (value: DVM, dispose?: () => void): void => {
        this._dvm = value;
        this._dvm.subscribe(this, 'perspective');
        this._loaded = true;
      },
      false, // true will call twice at init
    );
    //console.log({consumer})
  }


}
