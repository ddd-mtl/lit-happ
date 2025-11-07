import {ActionId, ActionIdMap, AgentId} from "@ddd-qc/cell-proxy";


/** */
export type SharedOwnershipSnapshot = {
  shareds: [ActionId, AgentId[]][];
}


// export type SharedOwnershipComparable = {
//   keyCount: number,
//   shareds: [ActionId, AgentId[]][],
// }


/** */
export class SharedOwnershipPerspective {
  shared_keys: ActionId[] = [];
  shareds: ActionIdMap<AgentId[]> = new ActionIdMap();

  /** -- Getters -- */

  getOwners(sharedAh: ActionId): AgentId[] | undefined {
    return this.shareds.get(sharedAh);
  }

  /** -- Memento -- */

  /** TODO: deep copy */
  makeSnapshot(): SharedOwnershipSnapshot {
    let shareds: [ActionId, AgentId[]][] = [];
    for (const [shared, owners] of this.shareds.entries()) {
      shareds.push([shared, owners])
    }
    /** */
    return {shareds};
  }
}



/** */
export class SharedOwnershipPerspectiveMutable extends SharedOwnershipPerspective {

  get readonly(): SharedOwnershipPerspective {
    return this;
  }

  storeKey(keyAh: ActionId) {
    this.shared_keys.push(keyAh);
  }

  storeShared(sharedAh: ActionId) {
    const owners = this.shareds.get(sharedAh);
    if (!owners) {
      this.shareds.set(sharedAh, [])
    }
  }

  storeOwner(sharedAh: ActionId, owner: AgentId) {
    const owners = this.shareds.get(sharedAh);
    if (!owners) {
      this.shareds.set(sharedAh, [owner])
    } else {
      //if (owners.includes()) {
        owners.push(owner);
      //}
    }
  }


  /** -- Memento -- */

  /** */
  restore(snapshot: SharedOwnershipSnapshot) {
    /** Clear */
    this.shared_keys = [];
    this.shareds.clear();
    /** Store */
    for (const [sharedAh, owners] of snapshot.shareds) {
      for (const owner of owners) {
        this.storeOwner(sharedAh, owner);
      }
    }
  }
}
