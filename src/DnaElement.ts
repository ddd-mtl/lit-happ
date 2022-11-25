import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {LitElement} from "lit";
import {property, state} from "lit/decorators.js";
import {ContextConsumer, createContext} from "@lit-labs/context";
import {IDnaViewModel} from "./DnaViewModel";
import {CellId, InstalledCell, RoleId} from "@holochain/client";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {ICellDef, RoleSpecificMixin, RoleSpecific} from "./CellDef";


/**
 * LitElement that is bound to a specific DnaViewModel
 */
export class DnaElement<P, DVM extends IDnaViewModel> extends RoleSpecificMixin(ScopedElementsMixin(LitElement)) implements ICellDef {

  constructor(dvm: typeof RoleSpecific) {
    super();
    this.setRoleId(dvm.roleId);
    this.requestDvm();
  }

  /** Provided by Context depending on dnaName */
  protected _dvm!: DVM;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: P;

  /** CellDef interface */
  get cellDef(): InstalledCell {return this._dvm.cellDef}
  //get roleId(): RoleId { return this._dvm.roleId } // Already defined in RoleSpecificMixin
  get cellId(): CellId { return this._dvm.cellId }
  get dnaHash(): EntryHashB64 { return this._dvm.dnaHash}
  get agentPubKey(): AgentPubKeyB64 { return this._dvm.agentPubKey }


  /** -- Methods -- */

  /** */
  private requestDvm() {
    /** Consume Context based on given dnaHash */
    const contextType = createContext<DVM>('dvm/'+ this.roleId);
    console.log(`Requesting context "${contextType}"`)
    /*const consumer =*/ new ContextConsumer(
      this,
      contextType,
      (value: DVM, dispose?: () => void): void => {
        this._dvm = value;
        this._dvm.subscribe(this, 'perspective');
      },
      false, // true will call twice at init
    );
    //console.log({consumer})
  }


}
