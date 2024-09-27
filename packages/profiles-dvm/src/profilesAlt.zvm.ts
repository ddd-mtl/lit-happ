import {
  ActionId,
  AgentId,
  EntryId, holoIdReviver,
  LinkPulseMat,
  StateChangeType,
  ZomeViewModelWithSignals
} from "@ddd-qc/lit-happ";
import {Profile} from "./bindings/profiles.types";
import {decode} from "@msgpack/msgpack";
import {ProfilesAltProxy} from "./bindings/profilesAlt.proxy";
import {EntryPulseMat} from "@ddd-qc/lit-happ/dist/ZomeViewModelWithSignals";
import {ProfilesLinkType} from "./bindings/profiles.integrity";
import {ProfilesAltUnitEnum} from "./bindings/profilesAlt.integrity";
import {
  ProfilesAltComparable,
  ProfilesAltPerspective,
  ProfilesAltPerspectiveMutable,
  ProfilesAltSnapshot
} from "./profilesAlt.perspective";


/**
 *
 */
export class ProfilesAltZvm extends ZomeViewModelWithSignals {

  /** -- Concret -- */

  static override readonly ZOME_PROXY = ProfilesAltProxy;
  get zomeProxy(): ProfilesAltProxy {return this._zomeProxy as ProfilesAltProxy;}


  /** */
  override comparable(): Object {
    const res: ProfilesAltComparable = {
      profileCount: this._perspective.profileByAgent.size,
      profiles: Array.from(this.perspective.profiles.values()).map((pair) => pair[0]),
    };
    return res;
  }

  /* */
  protected hasChanged(): boolean {
    const current = this.comparable() as ProfilesAltComparable;
    const prev = this._previousPerspective as ProfilesAltComparable;
    if (!prev) { return true }
    if (current.profileCount != prev.profileCount) return true;
    for (let i = 0; i < current.profileCount; i+= 1) {
      if (current.profiles[i] != prev.profiles[i]) { return true }
    }
    return false;
  }


  /** */
  override async initializePerspectiveOnline(): Promise<void> {
    await this.probeAllProfiles();
  }


  /** */
  override probeAllInner() {
    this.probeAllProfiles();
  }


  /* */
  get perspective(): ProfilesAltPerspective {
    return this._perspective.readonly;
  }


  /** -- */

  private _perspective: ProfilesAltPerspectiveMutable = new ProfilesAltPerspectiveMutable();


  /** -- Getters -- */

  getMyProfile(): Profile | undefined {
    return this._perspective.getProfile(this.cell.address.agentId);
  }



  /** -- Signals -- */

  /** */
  override async handleLinkPulse(pulse: LinkPulseMat, _from: AgentId): Promise<void> {
    switch (pulse.link_type) {
      case ProfilesLinkType.PrefixPath:
      case ProfilesLinkType.PathToAgent: {
        const agentEh = new EntryId(pulse.target.b64);
        const agentId = AgentId.from(agentEh);
        if (pulse.state != StateChangeType.Delete) {
            await this.findProfile(agentId);
        }
      }
      break;
      case ProfilesLinkType.AgentToProfile: {
        const agentEh = new EntryId(pulse.base.b64); // Make sure its an EntryHash
        const agentId = AgentId.from(agentEh);
        const profileAh = ActionId.from(pulse.target);
        if (pulse.state == StateChangeType.Delete) {
          this._perspective.unstoreAgentProfile(agentId, profileAh)
        } else {
          this._perspective.storeAgentProfile(agentId, profileAh)
        }
      }
      break;
    }
  }


  /** */
  override async handleEntryPulse(pulse: EntryPulseMat, _from: AgentId) {
    switch (pulse.entryType) {
      case ProfilesAltUnitEnum.Profile:
          const profile = decode(pulse.bytes) as Profile;
        if (pulse.state != StateChangeType.Delete) {
          this._perspective.storeProfile(pulse.ah, profile, pulse.ts);
        }
        break;
    }
  }


  /** -- Methods -- */

  /** */
  async probeAllProfiles()/*: Promise<Record<AgentPubKeyB64, ProfileMat>>*/ {
    try {
      await this.zomeProxy.probeProfiles();
    } catch(e) {}
  }


  /** */
  async findProfile(agentId: AgentId): Promise<Profile | undefined> {
    try {
      const maybeProfilePair = await this.zomeProxy.findProfile(agentId.hash);
      console.log("findProfile()", agentId, maybeProfilePair);
      if (!maybeProfilePair) {
        return;
      }
      return maybeProfilePair[1];
    } catch(e) {
      return undefined;
    }
    return undefined;
  }


  /** */
  async createMyProfile(profile: Profile): Promise<void> {
    await this.zomeProxy.createProfile([profile, this.cell.address.agentId.hash]);
  }


  /** */
  async updateMyProfile(profile: Profile): Promise<void> {
    await this.zomeProxy.updateProfile([profile, this.cell.address.agentId.hash]);
  }


  /** */
  async createProfile(profile: Profile, agentId: AgentId): Promise<void> {
    await this.zomeProxy.createProfile([profile, agentId.hash]);
  }


  /** */
  async updateProfile(profile: Profile, agentId: AgentId): Promise<void> {
    await this.zomeProxy.updateProfile([profile, agentId.hash]);
  }


  /** -- Import / Export -- */

  /** Dump perspective as JSON */
  export(): string {
    const snapshot = this._perspective.makeSnapshot();
    return JSON.stringify(snapshot, null, 2);
  }


  /** */
  import(json: string, canPublish: boolean) {
    const snapshot = JSON.parse(json, holoIdReviver) as ProfilesAltSnapshot;
    if (canPublish) {
      for (const [agentId, _profileAh, profile, _ts] of snapshot.all) {
        console.log("ProfilesAltZvm.import() publish profile", agentId.short, profile.nickname);
        const maybe = this._perspective.getProfile(agentId);
        if (!maybe) {
          /*await*/ this.createProfile(profile, agentId);
        } else {
          if (maybe != profile) {
            this.updateProfile(profile, agentId);
          }
        }
      }
      return;
    }
    /** */
    this._perspective.restore(snapshot);
    this.notifySubscribers();
  }
}
