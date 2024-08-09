import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {Profile} from "./bindings/profiles.types";
import {AgentPubKeyB64, decodeHashFromBase64, encodeHashToBase64} from "@holochain/client";
import {ProfilesProxy} from "./bindings/profiles.proxy";
import {decode} from "@msgpack/msgpack";


/** */
export interface ProfilesPerspective {
  /* AgentPubKeyB64 -> Profile */
  profiles: Record<AgentPubKeyB64, Profile>,
  ///* AgentPubKeyB64 -> Profile hash */
  //profile_ahs: Record<AgentPubKeyB64, ActionHashB64>,

  /** Nickname -> AgentPubKeyB64 */
  reversed: Record<string, AgentPubKeyB64>,
}


/**
 *
 */
export class ProfilesZvm extends ZomeViewModel {

  static override readonly ZOME_PROXY = ProfilesProxy;
  get zomeProxy(): ProfilesProxy {return this._zomeProxy as ProfilesProxy;}


  /* */
  protected hasChanged(): boolean {
    // TODO
    return true;
  }


  /** */
  override async initializePerspectiveOnline(): Promise<void> {
    await this.probeAllProfiles();
  }

  /** */
  override probeAllInner() {
    this.probeAllProfiles();
  }

  /** -- Perspective -- */

  /* */
  get perspective(): ProfilesPerspective {
    return {
      profiles: this._profiles,
      reversed: this._reversed,
      //profile_ahs: this._profile_ahs,
    };
  }

  private _profiles: Record<AgentPubKeyB64, Profile> = {};
  //private _profile_ahs: Record<AgentPubKeyB64, ActionHashB64> = {};
  private _reversed: Record<string, AgentPubKeyB64> = {};


  getMyProfile(): Profile | undefined { return this._profiles[this.cell.address.agentId.b64] }

  getProfile(agent: AgentPubKeyB64): Profile | undefined {return this._profiles[agent]}

  //getProfileHash(agent: AgentPubKeyB64): ActionHashB64 | undefined {return this._profile_ahs[agent]}

  getAgents(): AgentPubKeyB64[] { return Object.keys(this._profiles)}

  getNames(): string[] { return Object.keys(this._reversed)}


  /** Dump perspective as JSON */
  exportPerspective(): string {
    //console.log("exportPerspective()", perspMat);
    return JSON.stringify(this._profiles, null, 2);
  }


  /** */
  importPerspective(json: string, _mapping?: Object) {
    const profiles = JSON.parse(json) as Record<AgentPubKeyB64, Profile>;
    for (const [pubKey, profileMat] of Object.entries(profiles)) {
      this.storeProfile(pubKey, profileMat);
    }
  }

  /** -- Methods -- */

  /* */
  findProfiles(names: string[]): AgentPubKeyB64[] {
    let res: AgentPubKeyB64[] = []
    for (const name of names) {
      if (this._reversed[name]) {
        res.push(this._reversed[name]!)
      }
    }
    return res;
  }


  /** */
  async probeAllProfiles(): Promise<Record<AgentPubKeyB64, Profile>> {
    let allAgents;
    /** Attempt a retry on fail as this can create an entry (path anchor) and generate a 'head has moved' error */
    try {
      allAgents = await this.zomeProxy.getAgentsWithProfile();
    } catch(e) {
      allAgents = await this.zomeProxy.getAgentsWithProfile();
    }
    for (const agentPubKey of allAgents) {
      const maybeProfile = await this.zomeProxy.getAgentProfile(agentPubKey);
      if (!maybeProfile) {
        continue;
      }
      const profile: Profile = decode((maybeProfile.entry as any).Present.entry) as Profile;
      this.storeProfile(encodeHashToBase64(agentPubKey), profile);
    }
    this.notifySubscribers();
    return this._profiles;
  }


  /** */
  storeProfile(pubKeyB64: AgentPubKeyB64, profile: Profile) {
    this._profiles[pubKeyB64] = profile;
    this._reversed[profile.nickname] = pubKeyB64;
    this.notifySubscribers();
  }


  /** */
  async probeProfile(pubKeyB64: AgentPubKeyB64): Promise<Profile | undefined> {
    const maybeProfile = await this.zomeProxy.getAgentProfile(decodeHashFromBase64(pubKeyB64));
    console.log("probeProfile() maybeProfile", maybeProfile);
    if (!maybeProfile) {
      return;
    }
    // const profileEntry: any = decode((maybeProfile.entry as any).Present.entry);
    // console.log("probeProfile() profileEntry", profileEntry);
    //const profile: Profile = decode(profileEntry.record.entry.Present.entry) as Profile;
    const profile: Profile = decode((maybeProfile.entry as any).Present.entry) as Profile;
    console.log("probeProfile() profile", profile);
    this.storeProfile(pubKeyB64, profile);
    return profile;
  }


  /** */
  async createMyProfile(profile: Profile): Promise<void> {
    /*const record =*/ await this.zomeProxy.createProfile(profile);
    this.storeProfile(this.cell.address.agentId.b64, profile);
  }


  /** */
  async updateMyProfile(profile: Profile): Promise<void> {
    /*const record =*/ await this.zomeProxy.updateProfile(profile);
    this.storeProfile(this.cell.address.agentId.b64, profile);
  }

}
