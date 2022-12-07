import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {LitElement} from "lit";
import {property, state} from "lit/decorators.js";
import {ContextConsumer, createContext} from "@lit-labs/context";
import {DnaViewModel} from "./DnaViewModel";
import {CellId, InstalledCell} from "@holochain/client";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {BaseRoleName, IInstalledCell, RoleInstanceId, RoleSpecificMixin} from "@ddd-qc/cell-proxy";

/**
 * A LitElement that is bound to a specific DnaViewModel, e.g. a View for the ViewModel
 */
export class DnaElement<P, DVM extends DnaViewModel> extends RoleSpecificMixin(ScopedElementsMixin(LitElement)) implements IInstalledCell {

  /** if BaseRoleName is not provided, subclass must call requestDvm() in its Ctor */
  constructor(baseRoleName?: BaseRoleName) {
    super();
    if (baseRoleName) {
      this.baseRoleName = baseRoleName;
      this.requestDvm();
    }
  }

  /** Provided by Context depending on BaseRoleName */
  @state() protected _dvm!: DVM;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: P;

  /** InstalledCell interface */
  get installedCell(): InstalledCell {return this._dvm.installedCell}
  get roleInstanceId(): RoleInstanceId { return this._dvm.roleInstanceId } // Already defined in RoleSpecificMixin
  get cellId(): CellId { return this._dvm.cellId }
  get dnaHash(): EntryHashB64 { return this._dvm.dnaHash}
  get agentPubKey(): AgentPubKeyB64 { return this._dvm.agentPubKey }


  /** -- Methods -- */

  /** */
  protected requestDvm() {
    /** Consume Context based on given dnaHash */
    const contextType = createContext<DVM>('dvm/'+ this.baseRoleName);
    console.log(`\t\tRequesting context "${contextType}"`)
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

  /** */
  shouldUpdate() {
    return !!this._dvm;
  }
}