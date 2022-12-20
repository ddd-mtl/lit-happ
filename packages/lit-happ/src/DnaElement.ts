import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {LitElement, PropertyValues} from "lit";
import {property, state} from "lit/decorators.js";
import {ContextConsumer, contextProvided, createContext} from "@lit-labs/context";
import {DnaViewModel} from "./DnaViewModel";
import {CellId, InstalledCell} from "@holochain/client";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {BaseRoleName, IInstalledCell, RoleInstanceId, RoleSpecificMixin} from "@ddd-qc/cell-proxy";
import {cellContext} from "./elements/cell-context";

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

  @contextProvided({ context: cellContext, subscribe: true})
  @property({type: Object})
  installedCell!: InstalledCell;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  perspective!: P;

  /** InstalledCell interface */
  //get installedCell(): InstalledCell {return this._dvm.installedCell}
  get roleInstanceId(): RoleInstanceId { return this._dvm.roleInstanceId }
  get cellId(): CellId { return this._dvm.cellId }
  get dnaHash(): EntryHashB64 { return this._dvm.dnaHash}
  get agentPubKey(): AgentPubKeyB64 { return this._dvm.agentPubKey }


  /** -- Methods -- */

  /** */
  protected requestDvm() {
    /** Consume Context based on given dnaHash */
    const roleInstanceId = this.installedCell? this.installedCell.role_id : this.baseRoleName;
    const contextType = createContext<DVM>('dvm/'+ roleInstanceId);
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
  shouldUpdate(_changedProperties: PropertyValues<this>) {
    return !!this._dvm;
  }


  /** */
  protected willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("installedCell")) {
      this.requestDvm();
    }
  }
}
