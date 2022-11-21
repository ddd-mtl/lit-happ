import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {LitElement} from "lit";
import {property, state} from "lit/decorators.js";
import {ContextConsumer, contextProvided, createContext} from "@lit-labs/context";
import {InstalledCell} from "@holochain/client";
import {serializeHash} from "@holochain-open-dev/utils";
import {ViewModel} from "./ViewModel";
import {cellContext} from "./elements/cell-context";


/**
 * LitElement that is bound to a specific ZomeViewModel
 */
export class ZomeElement<P, Z extends ViewModel<P>> extends ScopedElementsMixin(LitElement) {

  constructor(public zomeName: string) {
    super();
  }

  @state() protected _loaded = false;

  @contextProvided({ context: cellContext, subscribe: true })
  @property({type: Object})
  cellData!: InstalledCell;

  /** Provided by Context depending on cellData.dnaHash */
  protected _zvm!: Z;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: P;

  /** */
  async firstUpdated() {
    //console.log("LabelList firstUpdated()", serializeHash(this.cellData?.cell_id[0]))
    /** Consume Context based on given dnaHash */
    /*const consumer =*/ new ContextConsumer(
      this,
      createContext<Z>('zvm/'+ this.zomeName + '/' + serializeHash(this.cellData.cell_id[0])),
      (value: Z, dispose?: () => void): void => {
        this._zvm = value;
        this._zvm.subscribe(this, 'perspective');
        this._loaded = true;
      },
      false, // true will call twice at init
    );
    //console.log({consumer})
  }


}
