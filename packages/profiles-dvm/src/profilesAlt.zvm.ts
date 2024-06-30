import {
  ActionId, ActionIdMap,
  AgentId,
  AgentIdMap,
  EntryId,
  getVariantByIndex,
  intoLinkableId,
  ZomeViewModel
} from "@ddd-qc/lit-happ";
import {LinkTypes, Profile as ProfileMat} from "./bindings/profiles.types";
import {AppSignal, AppSignalCb, Timestamp} from "@holochain/client";
import {decode} from "@msgpack/msgpack";
import {ProfilesAltProxy} from "./bindings/profilesAlt.proxy";
import {
  EntryPulse,
  EntryTypesType,
  LinkPulse, StateChangeType,
  TipProtocol,
  ZomeSignal,
  ZomeSignalProtocolType
} from "./bindings/profilesAlt.types";
import {Profiler} from "inspector";
import Profile = module


/** */
export interface ProfilesAltPerspectiveCore {
  /* ActionId -> Profile */
  profiles: ActionIdMap<[ProfileMat, Timestamp]>,
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
export class ProfilesAltZvm extends ZomeViewModel {

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

  getMyProfile(): ProfileMat | undefined { return this._perspective.profiles.get(this.cell.agentId) }

  getProfileAgent(profileId: ActionId): AgentId | undefined {
    for (const [agentId, profId] of this._perspective.profileByAgent.entries()) {
      if (profileId.b64 == profId.b64) {
        return agentId;
      }
    }
    return undefined;
  }

  getProfile(agent: AgentId): ProfileMat | undefined {
    const profileAh = this._perspective.profileByAgent.get(agent);
    if (!profileAh) {
      return undefined;
    }
    return this._perspective.profiles.get(profileAh)[0];

  }

  getProfileTs(agent: AgentId):  | undefined {
    const profileAh = this._perspective.profileByAgent.get(agent);
    if (!profileAh) {
      return undefined;
    }
    return this._perspective.profiles.get(profileAh)[1];
  }

  getAgents(): AgentId[] { return Array.from(this._perspective.profileByAgent.keys())}

  getNames(): string[] { return Object.keys(this._perspective.agentByName)}


  /** -- Signals -- */

  readonly signalHandler?: AppSignalCb = this.handleSignal;

  /** */
  handleSignal(signal: AppSignal) {
    if (signal.zome_name !== ProfilesAltZvm.DEFAULT_ZOME_NAME) {
      return;
    }
    console.log("ProfilesAltZvm.handleSignal()", signal);
    const zomeSignal = signal.payload as ZomeSignal;
    //console.log("THREADS received signal", threadsSignal);
    if (!("pulses" in zomeSignal)) {
      return;
    }
    /*await*/ this.handleProfilesSignal(zomeSignal);
  }


  /** */
  async handleProfilesSignal(signal: ZomeSignal): Promise<void> {
    const from = new AgentId(signal.from);
    let all = [];
    for (let pulse of signal.pulses) {
      /** -- Handle Signal according to type -- */
      /** Change tip to Entry or Link signal */
      if (ZomeSignalProtocolType.Tip in pulse) {
        pulse = this.handleTip(pulse.Tip as TipProtocol, from);
        if (!pulse) {
          continue;
        }
      }
      if (ZomeSignalProtocolType.Entry in pulse) {
        all.push(this.handleEntrySignal(pulse.Entry as EntryPulse, from));
        continue;
      }
      if (ZomeSignalProtocolType.Link in pulse) {
        all.push(this.handleLinkSignal(pulse.Link as LinkPulse, from));
        continue;
      }
    }
    await Promise.all(all);
    /** */
    this.notifySubscribers();
  }


  /** */
  async handleLinkSignal(pulse: LinkPulse, from: AgentId): Promise<void> {
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
        if (state != StateChangeType.Delete) {
          this.storeAgentProfile(base, target)
        }
        // FIXME: handle delete
        // FIXME: tip?
        break;
    }
  }


  /** */
  private async handleEntrySignal(pulse: EntryPulse, from: AgentId) {
    const entryType = getVariantByIndex(EntryTypesType, pulse.def.entry_index);
    const author = new AgentId(pulse.author);
    const ah = new ActionId(pulse.ah);
    const eh = new EntryId(pulse.eh);
    const state = Object.keys(pulse.state)[0];
    const isNew = (pulse.state as any)[state];
    let tip: TipProtocol;
    switch (entryType) {
      case EntryTypesType.Profile:
          const profile = decode(pulse.bytes) as Profile;
        if (state != StateChangeType.Delete) {
          this.storeProfile(ah, profile, pulse.ts);
        }
        // FIXME: handle delete?
        if (isNew && from == this.cell.agentId) {
          // FIXME tip peers
        }
        break;
    }
    /** */
    if (tip) {
      await this.broadcastTip(tip);
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
      for (const [agentId, profileMat] of perspective.profiles.entries()) {
        await this.createProfile(profileMat, agentId);
      }
      return;
    }
    /** */
    for (const [actionId, profileMat] of perspective.profiles.entries()) {
      this.storeProfile(actionId, profileMat, Date.now());
    }
    for (const [agentId, actionId] of perspective.profileByAgent.entries()) {
      this.storeAgentProfile(agentId, actionId);
    }
  }


  /** -- Store -- */

  /** */
  storeAgentProfile(agentId: AgentId, profileAh: ActionId) {
    this._perspective.profileByAgent.set(agentId, profileAh);
    const profile = this.getProfile(agentId);
    if (profile) {
      this._perspective.agentByName[profile.nickname] = agentId;
    }
  }

  /** */
  storeProfile(profileAh: ActionId, profile: ProfileMat, ts: Timestamp) {
    this._perspective.profiles.set(profileAh, [profile, ts]);
    const agentId = this.getProfileAgent(profileAh);
    if (agentId) {
      this._perspective.agentByName[profile.nickname] = agentId;
    }
    this._perspective.agentByName[profile.nickname] = agentId;
  }


  /** -- Methods -- */

  /** */
  async probeAllProfiles()/*: Promise<Record<AgentPubKeyB64, ProfileMat>>*/ {
    await this.zomeProxy.probeProfiles();
  }


  /** */
  async findProfile(agentId: AgentId): Promise<ProfileMat | undefined> {
    const maybeProfilePair = await this.zomeProxy.findProfile(agentId.hash);
    console.log("probeProfile() maybeProfile", maybeProfilePair.length);
    if (!maybeProfilePair) {
      return;
    }
    return maybeProfilePair[1];
  }


  /** */
  async createMyProfile(profile: ProfileMat): Promise<void> {
    const _ah = await this.zomeProxy.createProfile([profile, this.cell.agentId.hash]);
  }


  /** */
  async updateMyProfile(profile: ProfileMat): Promise<void> {
    const _ah = await this.zomeProxy.updateProfile([profile, this.cell.agentId.hash]);
  }


  /** */
  async createProfile(profile: ProfileMat, agentId: AgentId): Promise<void> {
    const _ah = await this.zomeProxy.createProfile([profile, agentId.hash]);
  }


  /** */
  async updateProfile(profile: ProfileMat, agentId: AgentId): Promise<void> {
    const _ah = await this.zomeProxy.updateProfile([profile, agentId.hash]);
  }

}
