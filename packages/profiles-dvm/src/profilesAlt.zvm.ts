import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {Profile as ProfileMat} from "./bindings/profiles.types";
import {AgentPubKeyB64, decodeHashFromBase64, encodeHashToBase64} from "@holochain/client";
import {decode} from "@msgpack/msgpack";
import {ProfilesAltProxy} from "./bindings/profilesAlt.proxy";


/** */
export interface ProfilesAltPerspective {
  /* AgentPubKeyB64 -> Profile */
  profiles: Record<AgentPubKeyB64, ProfileMat>,
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
      reversed: this._reversed,
      //profile_ahs: this._profile_ahs,
    };
  }

  private _profiles: Record<AgentPubKeyB64, ProfileMat> = {};
  //private _profile_ahs: Record<AgentPubKeyB64, ActionHashB64> = {};
  private _reversed: Record<string, AgentPubKeyB64> = {};


  getMyProfile(): ProfileMat | undefined { return this._profiles[this.cell.agentPubKey] }

  getProfile(agent: AgentPubKeyB64): ProfileMat | undefined {return this._profiles[agent]}

  //getProfileHash(agent: AgentPubKeyB64): ActionHashB64 | undefined {return this._profile_ahs[agent]}

  getAgents(): AgentPubKeyB64[] { return Object.keys(this._profiles)}

  getNames(): string[] { return Object.keys(this._reversed)}


  /** Dump perspective as JSON */
  exportPerspective(): string {
    //console.log("exportPerspective()", perspMat);
    return JSON.stringify(this._profiles, null, 2);
  }


  /** */
  importPerspective(json: string, canPublish: boolean) {
    const profiles = JSON.parse(json) as Record<AgentPubKeyB64, ProfileMat>;

    if (canPublish) {
      for (const [pubKey, profileMat] of Object.entries(profiles)) {
        /* await */ this.createProfile(profileMat, pubKey);
      }
      return;
    }

    for (const [pubKey, profileMat] of Object.entries(profiles)) {
      this.storeProfile(pubKey, profileMat);
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
      const maybeProfile = await this.zomeProxy.getProfile(agentPubKey);
      if (!maybeProfile) {
        continue;
      }
      const profile: ProfileMat = decode((maybeProfile.entry as any).Present.entry) as ProfileMat;
      this.storeProfile(encodeHashToBase64(agentPubKey), profile);
    }
    this.notifySubscribers();
    return this._profiles;
  }


  /** */
  storeProfile(pubKeyB64: AgentPubKeyB64, profile: ProfileMat) {
    this._profiles[pubKeyB64] = profile;
    this._reversed[profile.nickname] = pubKeyB64;
    this.notifySubscribers();
  }


  /** */
  async probeProfile(pubKeyB64: AgentPubKeyB64): Promise<ProfileMat | undefined> {
    const maybeProfile = await this.zomeProxy.getProfile(decodeHashFromBase64(pubKeyB64));
    console.log("probeProfile() maybeProfile", maybeProfile);
    if (!maybeProfile) {
      return;
    }
    // const profileEntry: any = decode((maybeProfile.entry as any).Present.entry);
    // console.log("probeProfile() profileEntry", profileEntry);
    //const profile: ProfileMat = decode(profileEntry.record.entry.Present.entry) as ProfileMat;
    const profile: ProfileMat = decode((maybeProfile.entry as any).Present.entry) as ProfileMat;
    console.log("probeProfile() profile", profile);
    this.storeProfile(pubKeyB64, profile);
    return profile;
  }


  /** */
  async createMyProfile(profile: ProfileMat): Promise<void> {
    /*const record =*/ await this.zomeProxy.createProfile([profile, decodeHashFromBase64(this.cell.agentPubKey)]);
    this.storeProfile(this.cell.agentPubKey, profile);
  }


  /** */
  async updateMyProfile(profile: ProfileMat): Promise<void> {
    /*const record =*/ await this.zomeProxy.updateProfile([profile, decodeHashFromBase64(this.cell.agentPubKey)]);
    this.storeProfile(this.cell.agentPubKey, profile);
  }


  /** */
  async createProfile(profile: ProfileMat, agent: AgentPubKeyB64): Promise<void> {
    /*const record =*/ await this.zomeProxy.createProfile([profile, decodeHashFromBase64(agent)]);
    this.storeProfile(agent, profile);
  }


  /** */
  async updateProfile(profile: ProfileMat, agent: AgentPubKeyB64): Promise<void> {
    /*const record =*/ await this.zomeProxy.updateProfile([profile, decodeHashFromBase64(agent)]);
    this.storeProfile(agent, profile);
  }

}
