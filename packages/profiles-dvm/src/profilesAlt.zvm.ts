import {AgentId, AgentIdMap, ZomeViewModel} from "@ddd-qc/lit-happ";
import {Profile as ProfileMat} from "./bindings/profiles.types";
import {AgentPubKeyB64, decodeHashFromBase64, encodeHashToBase64, Timestamp} from "@holochain/client";
import {decode} from "@msgpack/msgpack";
import {ProfilesAltProxy} from "./bindings/profilesAlt.proxy";


/** */
export interface ProfilesAltPerspective {
  /* AgentId -> Profile */
  profiles: AgentIdMap<ProfileMat>,
  profileDates: AgentIdMap<Timestamp>,
  ///* AgentPubKeyB64 -> Profile hash */
  //profile_ahs: Record<AgentPubKeyB64, ActionHashB64>,

  /** Nickname -> AgentId */
  reversed: Record<string, AgentId>,
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
    return {
      profiles: this._profiles,
      profileDates: this._profileDates,
      reversed: this._reversed,
      //profile_ahs: this._profile_ahs,
    };
  }

  private _profiles: AgentIdMap<ProfileMat> = new AgentIdMap<ProfileMat>();
  private _profileDates: AgentIdMap<Timestamp> = new AgentIdMap<Timestamp>();
  //private _profile_ahs: Record<AgentPubKeyB64, ActionHashB64> = {};
  private _reversed: Record<string, AgentId> = {};


  getMyProfile(): ProfileMat | undefined { return this._profiles.get(this.cell.agentId) }

  getProfile(agent: AgentId): ProfileMat | undefined {return this._profiles.get(agent)}

  getProfileDate(agent: AgentId): Timestamp | undefined {return this._profileDates.get(agent)}

  //getProfileHash(agent: AgentPubKeyB64): ActionHashB64 | undefined {return this._profile_ahs[agent]}

  getAgents(): AgentId[] { return Array.from(this._profiles.keys())}

  getNames(): string[] { return Object.keys(this._reversed)}


  /** Dump perspective as JSON */
  exportPerspective(): string {
    //console.log("exportPerspective()", perspMat);
    return JSON.stringify(this._profiles, null, 2);
    //return JSON.stringify(this.perspective, null, 2);
  }


  /** */
  async importPerspective(json: string, canPublish: boolean) {
    const perspective = JSON.parse(json) as ProfilesAltPerspective;
    if (canPublish) {
      for (const [agentId, profileMat] of perspective.profiles.entries()) {
        await this.createProfile(profileMat, agentId);
      }
      return;
    }
    /** */
    for (const [agentId, profileMat] of perspective.profiles.entries()) {
      this.storeProfile(agentId, profileMat, Date.now());
    }
  }


  /** -- Methods -- */

  /* */
  findProfiles(names: string[]): AgentPubKeyB64[] {
    let res  = []
    for (const name of names) {
      if (this._reversed[name]) {
        res.push(this._reversed[name])
      }
    }
    return res;
  }


  /** */
  async probeAllProfiles()/*: Promise<Record<AgentPubKeyB64, ProfileMat>>*/ {
    let allAgents;
    /** Attempt a retry on fail as this can create an entry (path anchor) and generate a 'head has moved' error */
    try {
      allAgents = await this.zomeProxy.getAgentsWithProfile();
    } catch(e) {
      allAgents = await this.zomeProxy.getAgentsWithProfile();
    }
    for (const agentPubKey of allAgents) {
      const maybeProfileRecord = await this.zomeProxy.getProfile(agentPubKey);
      if (!maybeProfileRecord) {
        continue;
      }
      const timestamp = maybeProfileRecord.signed_action.hashed.content.timestamp;
      const profile: ProfileMat = decode((maybeProfileRecord.entry as any).Present.entry) as ProfileMat;
      this.storeProfile(new AgentId(agentPubKey), profile, timestamp);
    }
    this.notifySubscribers();
    //return this._profiles;
  }


  /** */
  storeProfile(agentId: AgentId, profile: ProfileMat, ts: Timestamp) {
    this._profiles.set(agentId, profile);
    this._profileDates.set(agentId, ts);
    this._reversed[profile.nickname] = agentId;
    this.notifySubscribers();
  }


  /** */
  async probeProfile(agentId: AgentId): Promise<ProfileMat | undefined> {
    const maybeProfileRecord = await this.zomeProxy.getProfile(agentId.hash);
    console.log("probeProfile() maybeProfile", maybeProfileRecord);
    if (!maybeProfileRecord) {
      return;
    }
    // const profileEntry: any = decode((maybeProfile.entry as any).Present.entry);
    // console.log("probeProfile() profileEntry", profileEntry);
    //const profile: ProfileMat = decode(profileEntry.record.entry.Present.entry) as ProfileMat;
    const timestamp = maybeProfileRecord.signed_action.hashed.content.timestamp;
    const profile: ProfileMat = decode((maybeProfileRecord.entry as any).Present.entry) as ProfileMat;
    console.log("probeProfile() profile", profile);
    this.storeProfile(agentId, profile, timestamp);
    return profile;
  }


  /** */
  async createMyProfile(profile: ProfileMat): Promise<void> {
    const record = await this.zomeProxy.createProfile([profile, this.cell.agentId.hash]);
    const timestamp = record.signed_action.hashed.content.timestamp;
    this.storeProfile(this.cell.agentId, profile, timestamp);
  }


  /** */
  async updateMyProfile(profile: ProfileMat): Promise<void> {
    const record = await this.zomeProxy.updateProfile([profile, this.cell.agentId.hash]);
    const timestamp = record.signed_action.hashed.content.timestamp;
    this.storeProfile(this.cell.agentId, profile, timestamp);
  }


  /** */
  async createProfile(profile: ProfileMat, agentId: AgentId): Promise<void> {
    const record = await this.zomeProxy.createProfile([profile, agentId.hash]);
    const timestamp = record.signed_action.hashed.content.timestamp;
    this.storeProfile(agentId, profile, timestamp);
  }


  /** */
  async updateProfile(profile: ProfileMat, agentId: AgentId): Promise<void> {
    const record = await this.zomeProxy.updateProfile([profile, agentId.hash]);
    const timestamp = record.signed_action.hashed.content.timestamp;
    this.storeProfile(agentId, profile, timestamp);
  }

}
