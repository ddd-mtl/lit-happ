import {
  ActionId,
  ActionIdMap,
  AgentId,
  AgentIdMap,
  enc64,
  EntryId,
  LinkPulseMat, materializeEntryPulse, materializeLinkPulse,
  prettyDate,
  prettyState,
  SignalLog,
  SignalType, StateChangeType,
  TipProtocol,
  ZomeSignal,
  ZomeSignalProtocol,
  ZomeSignalProtocolType,
  ZomeViewModelWithSignals
} from "@ddd-qc/lit-happ";
import {Profile} from "./bindings/profiles.types";
import {Timestamp} from "@holochain/client";
import {decode} from "@msgpack/msgpack";
import {ProfilesAltProxy} from "./bindings/profilesAlt.proxy";
import {EntryPulseMat} from "@ddd-qc/lit-happ/dist/ZomeViewModelWithSignals";
import {ProfilesLinkType} from "./bindings/profiles.integrity";
import {ProfilesAltLinkType, ProfilesAltUnitEnum} from "./bindings/profilesAlt.integrity";


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


  /** -- Getters -- */

  getProfileAgent(profileId: ActionId): AgentId | undefined {
    for (const [agentId, profId] of this._perspective.profileByAgent.entries()) {
      if (profileId.b64 == profId.b64) {
        return agentId;
      }
    }
    return undefined;
  }

  getMyProfile(): Profile | undefined {
    return this.getProfile(this.cell.agentId);
  }

  getProfile(agent: AgentId): Profile | undefined {
    const profileAh = this._perspective.profileByAgent.get(agent);
    //console.log("ProfilesAltZvm.getProfile()", agent, profileAh);
    if (!profileAh) {
      return undefined;
    }
    const pair = this._perspective.profiles.get(profileAh);
    //console.log("ProfilesAltZvm.getProfile() pair", pair);
    if (!pair) {
      return undefined;
    }
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


  /** -- Signals -- */

  /** */
  async handleLinkPulse(pulse: LinkPulseMat, from: AgentId): Promise<void> {
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
          this.unstoreAgentProfile(agentId, profileAh)
        } else {
          this.storeAgentProfile(agentId, profileAh)
        }
      }
      break;
    }
  }


  /** */
  async handleEntryPulse(pulse: EntryPulseMat, from: AgentId) {
    switch (pulse.entryType) {
      case ProfilesAltUnitEnum.Profile:
          const profile = decode(pulse.bytes) as Profile;
        if (pulse.state != StateChangeType.Delete) {
          this.storeProfile(pulse.ah, profile, pulse.ts);
        }
        break;
    }
  }


  // /** */
  // dumpSignalLogs(signalLogs: SignalLog[]) {
  //   this.dumpCastLogs();
  //   console.warn(`Signals received from zome "${this.zomeName}"`);
  //   let appSignals: any[] = [];
  //   signalLogs
  //     .filter((log) => log.type == SignalType.Zome)
  //     .map((log) => {
  //       const signal = log.zomeSignal as ZomeSignal;
  //       const pulses = signal.pulses as ZomeSignalProtocol[];
  //       const timestamp = prettyDate(new Date(log.ts));
  //       const from = enc64(signal.from) == this.cell.agentId.b64? "self" : new AgentId(signal.from);
  //       for (const pulse of pulses) {
  //         if (ZomeSignalProtocolType.Tip in pulse) {
  //           const tip: TipProtocol = pulse.Tip;
  //           const type = Object.keys(tip)[0];
  //           appSignals.push({timestamp, from, pulse: ZomeSignalProtocolType.Tip, type, payload: tip});
  //         }
  //         if (ZomeSignalProtocolType.Entry in pulse) {
  //           const entryPulse = materializeEntryPulse(pulse.Entry, Object.values(ProfilesAltUnitEnum));
  //           const typedEntry = decode(entryPulse.bytes);
  //           appSignals.push({timestamp, from, pulse: ZomeSignalProtocolType.Entry, state: prettyState(pulse.Entry.state), type: entryPulse.entryType, payload: typedEntry, ah_base: entryPulse.ah.short, eh_target: entryPulse.eh.short});
  //         }
  //         if (ZomeSignalProtocolType.Link in pulse) {
  //             const linkPulse = materializeLinkPulse(pulse.Link, Object.values(ProfilesAltLinkType));
  //             appSignals.push({timestamp, from, pulse: ZomeSignalProtocolType.Link, state: prettyState(pulse.Link.state), type: linkPulse.link_type, payload: linkPulse.tag, ah_base: linkPulse.base.print(), eh_target: linkPulse.target.print()});
  //         }
  //       }
  //     });
  //   console.table(appSignals);
  // }


  /** -- Store -- */

  /** */
  storeProfile(profileAh: ActionId, profile: Profile, ts: Timestamp) {
    //console.log("ProfilesAltZvm.storeProfile()", profileAh, profile.nickname);
    this._perspective.profiles.set(profileAh, [profile, ts]);
    const agentId = this.getProfileAgent(profileAh);
    if (agentId) {
      this._perspective.agentByName[profile.nickname] = agentId;
    }
  }

  /** */
  storeAgentProfile(agentId: AgentId, profileAh: ActionId) {
    //console.log("ProfilesAltZvm.storeAgentProfile()", agentId, profileAh);
    this._perspective.profileByAgent.set(agentId, profileAh);
    const pair = this._perspective.profiles.get(profileAh);
    if (pair) {
      this._perspective.agentByName[pair[0].nickname] = agentId;
    }
  }

  /** */
  unstoreAgentProfile(agentId: AgentId, profileAh: ActionId) {
    //console.log("ProfilesAltZvm.unstoreAgentProfile()", agentId, profileAh);
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
  exportPerspective(): string {
    //console.log("exportPerspective()", perspMat);
    const core = this._perspective as ProfilesAltPerspectiveCore;  // FIXME: check if this actually works as expected
    return JSON.stringify(core, null, 2);
  }


  /** */
  async importPerspective(json: string, _canPublish: boolean) {
    const perspective = JSON.parse(json) as ProfilesAltPerspectiveCore;
    // if (canPublish) {
    //   for (const [profileAh, [profile, _ts]] of perspective.profiles.entries()) {
    //     await this.createProfile(profile, agentId);
    //   }
    //   return;
    // }
    /** */
    for (const [profileAh, [profile, ts]] of perspective.profiles.entries()) {
      this.storeProfile(profileAh, profile, ts);
    }
    for (const [agentId, profileAh] of perspective.profileByAgent.entries()) {
      this.storeAgentProfile(agentId, profileAh);
    }
  }


}
