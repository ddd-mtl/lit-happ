import {
  ActionId,
  AgentId, EntryId,
  holoIdReviver,
  LinkPulseMat, StateChangeType,
  ZomeViewModelWithSignals
} from "@ddd-qc/lit-happ";
import {SharedOwnershipProxy} from "./bindings/sharedOwnership.proxy";
import {
  SharedOwnershipPerspective,
  SharedOwnershipPerspectiveMutable,
  SharedOwnershipSnapshot
} from "./sharedOwnership.perspective";
import {SharedOwnershipLinkType} from "./bindings/sharedOwnership.integrity";



/**
 *
 */
export class SharedOwnershipZvm extends ZomeViewModelWithSignals {

  static override readonly ZOME_PROXY = SharedOwnershipProxy;
  get zomeProxy(): SharedOwnershipProxy {return this._zomeProxy as SharedOwnershipProxy;}


  /** */
  override async initializePerspectiveOffline(): Promise<void> {
    const keys = await this.zomeProxy.querySharedKeys();
    for (const key of keys) {
      const keyId = new ActionId(key)
      this._perspective.storeKey(keyId);
      this._perspective.storeOwner(keyId, this.cell.address.agentId);
    }
  }

  /** */
  override async initializePerspectiveOnline(): Promise<void> {
    await this.probeAllInner();
  }

  /** */
  override probeAllInner() {
    /*await*/ this.zomeProxy.probeShareds();
  }

  /* */
  get perspective(): SharedOwnershipPerspective {
    return this._perspective.readonly;
  }


  /** -- */

  private _perspective: SharedOwnershipPerspectiveMutable = new SharedOwnershipPerspectiveMutable();


  /** -- Signals -- */

  /** */
  override async handleLinkPulse(pulse: LinkPulseMat, _from: AgentId): Promise<void> {
    switch (pulse.link_type) {
      case SharedOwnershipLinkType.SharedPath: break;
      case SharedOwnershipLinkType.SharedEntry: {
        const sharedAh = ActionId.from(pulse.target.b64);
        if (pulse.state != StateChangeType.Delete) {
          this._perspective.storeShared(sharedAh)
        }
      }
      break;
      case SharedOwnershipLinkType.Shared: {
        const agentEh = new EntryId(pulse.base.b64); // Make sure it's an EntryHash
        const agentId = AgentId.from(agentEh);
        const sharedAh = ActionId.from(pulse.target);
        if (pulse.state == StateChangeType.Delete) {
          //this._perspective.unstoreShared(agentId, sharedAh)
        } else {
          this._perspective.storeOwner(sharedAh, agentId)
        }
      }
      break;
      case SharedOwnershipLinkType.Owner: {
        const agentEh = new EntryId(pulse.target.b64); // Make sure it's an EntryHash
        const agentId = AgentId.from(agentEh);
        const sharedAh = ActionId.from(pulse.base);
        if (pulse.state == StateChangeType.Delete) {
          //this._perspective.unstoreShared(agentId, sharedAh)
        } else {
          this._perspective.storeOwner(sharedAh, agentId)
        }
      }
      break;
    }
  }


  /** -- Import / Export -- */

  /** Dump perspective as JSON */
  export(): string {
    const snapshot = this._perspective.makeSnapshot();
    return JSON.stringify(snapshot, null, 2);
  }


  /** */
  import(json: string, canPublish: boolean) {
    const snapshot = JSON.parse(json, holoIdReviver) as SharedOwnershipSnapshot;
    if (canPublish) {
      // FIXME
      return
    }
    /** */
    this._perspective.restore(snapshot);
    this.notifySubscribers();
  }
}
