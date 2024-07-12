import {
  ActionId,
  AgentId,
  EntryId,
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
  ProfilesAltPerspective,
  ProfilesAltPerspectiveCore,
  ProfilesAltPerspectiveSnapshot
} from "./profilesAlt.perspective";


/**
 *
 */
export class ProfilesAltZvm extends ZomeViewModelWithSignals {

  static readonly ZOME_PROXY = ProfilesAltProxy;
  get zomeProxy(): ProfilesAltProxy {return this._zomeProxy as ProfilesAltProxy;}


  /* */
  protected hasChanged(): boolean {
    // TODO
    return true;
  }


  /** */
  async initializePerspectiveOnline(): Promise<void> {
    await this.probeAllProfiles();
  }

  /** */
  probeAllInner() {
    this.probeAllProfiles();
  }

  /** -- Perspective -- */

  /* */
  get perspective(): ProfilesAltPerspective {
    return this._perspective;
  }

  private _perspective: ProfilesAltPerspective = new ProfilesAltPerspective();


  /** -- Getters -- */

  getMyProfile(): Profile | undefined {
    return this._perspective.getProfile(this.cell.agentId);
  }



  /** -- Signals -- */

  /** */
  async handleLinkPulse(pulse: LinkPulseMat, _from: AgentId): Promise<void> {
    /** */
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
  async handleEntryPulse(pulse: EntryPulseMat, _from: AgentId) {
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
    await this.zomeProxy.probeProfiles();
  }


  /** */
  async findProfile(agentId: AgentId): Promise<Profile | undefined> {
    const maybeProfilePair = await this.zomeProxy.findProfile(agentId.hash);
    console.log("findProfile()", agentId, maybeProfilePair);
    if (!maybeProfilePair) {
      return;
    }
    return maybeProfilePair[1];
  }


  /** */
  async createMyProfile(profile: Profile): Promise<void> {
    const _ah = await this.zomeProxy.createProfile([profile, this.cell.agentId.hash]);
  }


  /** */
  async updateMyProfile(profile: Profile): Promise<void> {
    const _ah = await this.zomeProxy.updateProfile([profile, this.cell.agentId.hash]);
  }


  /** */
  async createProfile(profile: Profile, agentId: AgentId): Promise<void> {
    const _ah = await this.zomeProxy.createProfile([profile, agentId.hash]);
  }


  /** */
  async updateProfile(profile: Profile, agentId: AgentId): Promise<void> {
    const _ah = await this.zomeProxy.updateProfile([profile, agentId.hash]);
  }


  /** -- Import / Export -- */

  /** Dump perspective as JSON */
  export(): string {
    //console.log("exportPerspective()", perspMat);
    const core = this._perspective.makeSnapshot();
    return JSON.stringify(core, null, 2);
  }


  /** */
  import(json: string, _canPublish: boolean) {
    const core = JSON.parse(json) as ProfilesAltPerspectiveSnapshot;
    // if (canPublish) {
    //   for (const [profileAh, [profile, _ts]] of perspective.profiles.entries()) {
    //     await this.createProfile(profile, agentId);
    //   }
    //   return;
    // }
    /** */
    this._perspective.restore(core)
  }
}
