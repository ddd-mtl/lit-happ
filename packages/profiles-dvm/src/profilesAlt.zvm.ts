import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {Profile as ProfileMat} from "./bindings/profiles.types";
import {AgentPubKeyB64, decodeHashFromBase64, encodeHashToBase64, Timestamp} from "@holochain/client";
import {decode} from "@msgpack/msgpack";
import {ProfilesAltProxy} from "./bindings/profilesAlt.proxy";


/** */
export interface ProfilesAltPerspective {
  /* AgentPubKeyB64 -> Profile */
  profiles: Record<AgentPubKeyB64, ProfileMat>,
  profileDates: Record<AgentPubKeyB64, Timestamp>,
  ///* AgentPubKeyB64 -> Profile hash */
  //profile_ahs: Record<AgentPubKeyB64, ActionHashB64>,

  /** Nickname -> AgentPubKeyB64 */
  reversed: Record<string, AgentPubKeyB64>,
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

  private _profiles: Record<AgentPubKeyB64, ProfileMat> = {};
  private _profileDates: Record<AgentPubKeyB64, Timestamp> = {};
  //private _profile_ahs: Record<AgentPubKeyB64, ActionHashB64> = {};
  private _reversed: Record<string, AgentPubKeyB64> = {};


  getMyProfile(): ProfileMat | undefined { return this._profiles[this.cell.agentId.b64] }

  getProfile(agent: AgentPubKeyB64): ProfileMat | undefined {return this._profiles[agent]}

  getProfileDate(agent: AgentPubKeyB64): Timestamp | undefined {return this._profileDates[agent]}

  //getProfileHash(agent: AgentPubKeyB64): ActionHashB64 | undefined {return this._profile_ahs[agent]}

  getAgents(): AgentPubKeyB64[] { return Object.keys(this._profiles)}

  getNames(): string[] { return Object.keys(this._reversed)}


  /** Dump perspective as JSON */
  exportPerspective(): string {
    //console.log("exportPerspective()", perspMat);
    return JSON.stringify(this._profiles, null, 2);
    //return JSON.stringify(this.perspective, null, 2);
  }


  /** */
  async importPerspective(json: string, canPublish: boolean) {
    const profiles = JSON.parse(json) as ProfilesAltPerspective;
    if (canPublish) {
      for (const [pubKey, profileMat] of Object.entries(profiles)) {
        await this.createProfile(profileMat, pubKey);
      }
      return;
    }

    for (const [pubKey, profileMat] of Object.entries(profiles)) {
      this.storeProfile(pubKey, profileMat, Date.now());
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
  async probeAllProfiles(): Promise<Record<AgentPubKeyB64, ProfileMat>> {
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
      this.storeProfile(encodeHashToBase64(agentPubKey), profile, timestamp);
    }
    this.notifySubscribers();
    return this._profiles;
  }


  /** */
  storeProfile(pubKeyB64: AgentPubKeyB64, profile: ProfileMat, ts: Timestamp) {
    this._profiles[pubKeyB64] = profile;
    this._profileDates[pubKeyB64] = ts;
    this._reversed[profile.nickname] = pubKeyB64;
    this.notifySubscribers();
  }


  /** */
  async probeProfile(pubKeyB64: AgentPubKeyB64): Promise<ProfileMat | undefined> {
    const maybeProfileRecord = await this.zomeProxy.getProfile(decodeHashFromBase64(pubKeyB64));
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
    this.storeProfile(pubKeyB64, profile, timestamp);
    return profile;
  }


  /** */
  async createMyProfile(profile: ProfileMat): Promise<void> {
    const record = await this.zomeProxy.createProfile([profile, this.cell.agentId.hash]);
    const timestamp = record.signed_action.hashed.content.timestamp;
    this.storeProfile(this.cell.agentId.b64, profile, timestamp);
  }


  /** */
  async updateMyProfile(profile: ProfileMat): Promise<void> {
    const record = await this.zomeProxy.updateProfile([profile, this.cell.agentId.hash]);
    const timestamp = record.signed_action.hashed.content.timestamp;
    this.storeProfile(this.cell.agentId.b64, profile, timestamp);
  }


  /** */
  async createProfile(profile: ProfileMat, agent: AgentPubKeyB64): Promise<void> {
    const record = await this.zomeProxy.createProfile([profile, decodeHashFromBase64(agent)]);
    const timestamp = record.signed_action.hashed.content.timestamp;
    this.storeProfile(agent, profile, timestamp);
  }


  /** */
  async updateProfile(profile: ProfileMat, agent: AgentPubKeyB64): Promise<void> {
    const record = await this.zomeProxy.updateProfile([profile, decodeHashFromBase64(agent)]);
    const timestamp = record.signed_action.hashed.content.timestamp;
    this.storeProfile(agent, profile, timestamp);
  }

}
