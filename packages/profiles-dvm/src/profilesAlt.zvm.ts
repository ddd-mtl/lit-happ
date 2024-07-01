import {
  ActionId, ActionIdMap,
  AgentId,
  AgentIdMap,
  EntryId,
  getVariantByIndex,
  intoLinkableId,
  ZomeViewModelWithSignals
} from "@ddd-qc/lit-happ";
import {LinkTypes, Profile} from "./bindings/profiles.types";
import {Timestamp} from "@holochain/client";
import {decode} from "@msgpack/msgpack";
import {ProfilesAltProxy} from "./bindings/profilesAlt.proxy";
import {
  EntryPulse,
  EntryTypesType,
  LinkPulse, StateChangeType,
} from "./bindings/profilesAlt.types";


/** */
export interface ProfilesAltPerspectiveCore {
  /* ActionId -> Profile */
  profiles: ActionIdMap<[Profile, Timestamp]>,
  /* AgentId -> ActionId */
  profileByAgent: AgentIdMap<ActionId>,
}

export interface ProfilesAltPerspectiveLive {
  /** Nickname -> AgentId */
  agentByName: Record<string, AgentId>,
}

export type ProfilesAltPerspective = ProfilesAltPerspectiveCore & ProfilesAltPerspectiveLive;


function createProfilesAltPerspective(): ProfilesAltPerspective {
  return {
    profiles: new ActionIdMap(),
    profileByAgent: new AgentIdMap(),
    agentByName: {},
  }
}


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

  private _perspective: ProfilesAltPerspective = createProfilesAltPerspective();

  getMyProfile(): Profile | undefined {
    const pair = this._perspective.profiles.get(this.cell.agentId)
    if (!pair) {
      return undefined;
    }
    return pair[0];
  }

  getProfileAgent(profileId: ActionId): AgentId | undefined {
    for (const [agentId, profId] of this._perspective.profileByAgent.entries()) {
      if (profileId.b64 == profId.b64) {
        return agentId;
      }
    }
    return undefined;
  }

  getProfile(agent: AgentId): Profile | undefined {
    const profileAh = this._perspective.profileByAgent.get(agent);
    if (!profileAh) {
      return undefined;
    }
    const pair = this._perspective.profiles.get(profileAh);
    return pair[0];

  }

  getProfileTs(agent: AgentId): Timestamp | undefined {
    const profileAh = this._perspective.profileByAgent.get(agent);
    if (!profileAh) {
      return undefined;
    }
    const pair = this._perspective.profiles.get(profileAh);
    return pair[1];
  }

  getAgents(): AgentId[] { return Array.from(this._perspective.profileByAgent.keys())}

  getNames(): string[] { return Object.keys(this._perspective.agentByName)}



  /** */
  async handleLinkPulse(pulse: LinkPulse, from: AgentId): Promise<void> {
    const link = pulse.link;
    const linkAh = new ActionId(link.create_link_hash);
    const author = new AgentId(link.author);
    const base = intoLinkableId((link as any).base);
    const target = intoLinkableId(link.target);
    const state = Object.keys(pulse.state)[0];
    const isNew = (pulse.state as any)[state];
    /** */
    switch (getVariantByIndex(LinkTypes, link.link_type)) {
      case LinkTypes.PrefixPath:
      case LinkTypes.PathToAgent:
        break;
      case LinkTypes.AgentToProfile:
        if (state == StateChangeType.Delete) {
          this.unstoreAgentProfile(base, target)
        } else {
          this.storeAgentProfile(base, target)
        }
        if (isNew && from.b64 == this.cell.agentId.b64) {
          await this.broadcastTip({Link: pulse});
        }
        break;
    }
  }


  /** */
  async handleEntryPulse(pulse: EntryPulse, from: AgentId) {
    const entryType = getVariantByIndex(EntryTypesType, pulse.def.entry_index);
    const author = new AgentId(pulse.author);
    const ah = new ActionId(pulse.ah);
    const eh = new EntryId(pulse.eh);
    const state = Object.keys(pulse.state)[0];
    const isNew = (pulse.state as any)[state];
    switch (entryType) {
      case EntryTypesType.Profile:
          const profile = decode(pulse.bytes) as Profile;
        if (state != StateChangeType.Delete) {
          this.storeProfile(ah, profile, pulse.ts);
        }
        if (isNew && from.b64 == this.cell.agentId.b64) {
          await this.broadcastTip({Entry: pulse});
        }
        break;
    }
  }


  /** -- perspective -- */

  /** Dump perspective as JSON */
  exportPerspective(): string {
    //console.log("exportPerspective()", perspMat);
    const core = this._perspective as ProfilesAltPerspectiveCore;  // FIXME: check if this actually works as expected
    return JSON.stringify(core, null, 2);
  }


  /** */
  async importPerspective(json: string, canPublish: boolean) {
    const perspective = JSON.parse(json) as ProfilesAltPerspectiveCore;
    if (canPublish) {
      for (const [agentId, [profile, _ts]] of perspective.profiles.entries()) {
        await this.createProfile(profile, agentId);
      }
      return;
    }
    /** */
    for (const [actionId, [profile, ts]] of perspective.profiles.entries()) {
      this.storeProfile(actionId, profile, ts);
    }
    for (const [agentId, actionId] of perspective.profileByAgent.entries()) {
      this.storeAgentProfile(agentId, actionId);
    }
  }


  /** -- Store -- */


  /** */
  storeProfile(profileAh: ActionId, profile: Profile, ts: Timestamp) {
    this._perspective.profiles.set(profileAh, [profile, ts]);
    const agentId = this.getProfileAgent(profileAh);
    if (agentId) {
      this._perspective.agentByName[profile.nickname] = agentId;
    }
  }

  /** */
  storeAgentProfile(agentId: AgentId, profileAh: ActionId) {
    this._perspective.profileByAgent.set(agentId, profileAh);
    const pair = this._perspective.profiles.get(profileAh);
    if (pair) {
      this._perspective.agentByName[pair[0].nickname] = agentId;
    }
  }

  /** */
  unstoreAgentProfile(agentId: AgentId, profileAh: ActionId) {
    this._perspective.profileByAgent.delete(agentId);
    const pair = this._perspective.profiles.get(profileAh);
    if (pair) {
      delete this._perspective.agentByName[pair[0].nickname];
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
    console.log("probeProfile() maybeProfilePair", maybeProfilePair);
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

}
