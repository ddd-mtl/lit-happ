import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {LitElement} from "lit";
import {property, state} from "lit/decorators.js";
import {ContextConsumer, contextProvided, createContext} from "@lit-labs/context";
import {CellId, InstalledCell, RoleId} from "@holochain/client";
import {serializeHash} from "@holochain-open-dev/utils";
import {ViewModel} from "./ViewModel";
import {cellContext} from "./elements/cell-context";
import {ICellDef, IZomeSpecific} from "./CellDef";
import {AgentPubKeyB64, DnaHashB64} from "@holochain-open-dev/core-types";
import {IZomeViewModel} from "./ZomeViewModel";
import {ZomeProxy} from "./ZomeProxy";

/**
 * LitElement that is bound to a specific ZomeViewModel
 */
export class ZomeElement<P, ZVM extends IZomeViewModel> extends ScopedElementsMixin(LitElement) implements ICellDef, IZomeSpecific {

  constructor(protected _zomeName: string) {
    super();
  }

  @state() protected _loaded = false;


  @contextProvided({ context: cellContext, subscribe: true })
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


  get zomeName(): string { return this._zvm.zomeName};


  /** -- Methods -- */

  /** */
  async firstUpdated() {
    //console.log("LabelList firstUpdated()", serializeHash(this.cellData?.cell_id[0]))
    /** Consume Context based on given dnaHash */
    //const zvm = this._zvm as IZomeViewModel;
    //const zomeName = this._zvm.zomeName;
    //const zomeName = ZomeProxy.constructor.name;
    //const zomeName = Z.zomeName;
    const contextType = createContext<ZVM>('zvm/'+ this._zomeName + '/' + this.dnaHash)
    console.log(`Requesting context "${contextType}"`)
    /*const consumer =*/ new ContextConsumer(
      this,
      contextType,
      (value: ZVM, dispose?: () => void): void => {
        this._zvm = value;
        if (this._zomeName != this._zvm.zomeName) {
          throw Error(`ZVM and ZomeElement zomeNames mismatch: "${this._zomeName}" != "${this._zvm.zomeName}"`)
        }
        this._zvm.subscribe(this, 'perspective');
        this._loaded = true;
      },
      false, // true will call twice at init
    );
    //console.log({consumer})
  }


}
