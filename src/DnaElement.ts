import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {LitElement} from "lit";
import {property, state} from "lit/decorators.js";
import {ContextConsumer, createContext} from "@lit-labs/context";
import {IDnaViewModel} from "./DnaViewModel";
import {CellId, InstalledCell, RoleId} from "@holochain/client";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {ICellDef} from "./CellDef";


/**
 * LitElement that is bound to a specific DnaViewModel
 */
export class DnaElement<P, DVM extends IDnaViewModel> extends ScopedElementsMixin(LitElement) implements ICellDef {

  constructor(protected _roleId: RoleId) {
    super();
  }

  @state() protected _loaded = false;

  /** Provided by Context depending on dnaName */
  protected _dvm!: DVM;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: P;

  /** CellDef interface */
  get cellDef(): InstalledCell {return this._dvm.cellDef}
  get roleId(): RoleId { return this._dvm.roleId }
  get cellId(): CellId { return this._dvm.cellId }
  get dnaHash(): EntryHashB64 { return this._dvm.dnaHash}
  get agentPubKey(): AgentPubKeyB64 { return this._dvm.agentPubKey }


  /** -- methods -- */

  /** */
  async firstUpdated() {
    //console.log("LabelList firstUpdated()", serializeHash(this.cellData?.cell_id[0]))
    /** Consume Context based on given dnaHash */
    const contextType = createContext<DVM>('dvm/'+ this._roleId);
    console.log(`Requesting context "${contextType}"`)
    /*const consumer =*/ new ContextConsumer(
      this,
      contextType,
      (value: DVM, dispose?: () => void): void => {
        this._dvm = value;
        if (this._roleId != this._dvm.roleId) {
          throw Error(`DVM and DnaElement roleId mismatch: "${this._roleId}" != "${this._dvm.roleId}"`)
        }
        this._dvm.subscribe(this, 'perspective');
        this._loaded = true;
      },
      false, // true will call twice at init
    );
    //console.log({consumer})
  }


}
