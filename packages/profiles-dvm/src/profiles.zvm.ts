import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {ProfilesProxy, FileShareProfile} from "./profiles.proxy";
import {AgentPubKeyB64, decodeHashFromBase64, encodeHashToBase64, EntryHashB64} from "@holochain/client";


/** */
export interface ProfilesPerspective {
  /* AgentPubKeyB64 -> Profile */
  profiles: Record<AgentPubKeyB64, FileShareProfile>,
  ///* AgentPubKeyB64 -> Profile hash */
  //profile_ahs: Record<AgentPubKeyB64, ActionHashB64>,

  /** Nickname -> AgentPubKeyB64 */
  reversed: Record<string, AgentPubKeyB64>,
}


/**
 *
 */
export class ProfilesZvm extends ZomeViewModel {

  static readonly ZOME_PROXY = ProfilesProxy;
  get zomeProxy(): ProfilesProxy {return this._zomeProxy as ProfilesProxy;}


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
  get perspective(): ProfilesPerspective {
    return {
      profiles: this._profiles,
      reversed: this._reversed,
      //profile_ahs: this._profile_ahs,
    };
  }

  private _profiles: Record<AgentPubKeyB64, FileShareProfile> = {};
  //private _profile_ahs: Record<AgentPubKeyB64, ActionHashB64> = {};
  private _reversed: Record<string, AgentPubKeyB64> = {};


  getMyProfile(): FileShareProfile | undefined { return this._profiles[this.cell.agentPubKey] }

  getProfile(agent: AgentPubKeyB64): FileShareProfile | undefined {return this._profiles[agent]}

  //getProfileHash(agent: AgentPubKeyB64): ActionHashB64 | undefined {return this._profile_ahs[agent]}

  getAgents(): AgentPubKeyB64[] { return Object.keys(this._profiles)}

  getNames(): string[] { return Object.keys(this._reversed)}


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
  async probeAllProfiles(): Promise<Record<AgentPubKeyB64, FileShareProfile>> {
    let allAgents;
    /** Attempt a retry on fail as this can create an entry and generate an error (path anchor) */
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
      //const maybeProfile: ThreadsProfile = decode((record.entry as any).Present.entry) as ThreadsProfile;
      const pubKeyB64 = encodeHashToBase64(agentPubKey);
      this._profiles[pubKeyB64] = maybeProfile;
      this._reversed[maybeProfile.nickname] = pubKeyB64;
      //this._profile_ahs[pubKeyB64] = encodeHashToBase64(record.signed_action.hashed.hash);
    }
    this.notifySubscribers();
    return this._profiles;
  }


  /** */
  async probeProfile(pubKeyB64: AgentPubKeyB64): Promise<FileShareProfile | undefined> {
    const maybeProfile = await this.zomeProxy.getAgentProfile(decodeHashFromBase64(pubKeyB64));
    console.log("probeProfile()", maybeProfile);
    if (!maybeProfile) {
      return;
    }
    //const maybeProfile: ThreadsProfile = decode((record.entry as any).Present.entry) as ThreadsProfile;
    this._profiles[pubKeyB64] = maybeProfile;
    this._reversed[maybeProfile.nickname] = pubKeyB64;
    //this._profile_ahs[pubKeyB64] = encodeHashToBase64(record.signed_action.hashed.hash);
    this.notifySubscribers();
    return maybeProfile;
  }


  /** */
  async createMyProfile(profile: FileShareProfile): Promise<void> {
    /*const record =*/ await this.zomeProxy.createProfile(profile);
    this._profiles[this.cell.agentPubKey] = profile;
    this._reversed[profile.nickname] = this.cell.agentPubKey;
    //this._profile_ahs[this.cell.agentPubKey] = encodeHashToBase64(record.signed_action.hashed.hash);
    this.notifySubscribers();
  }

  /** */
  async updateMyProfile(profile: FileShareProfile): Promise<void> {
    /*const record =*/ await this.zomeProxy.updateProfile(profile);
    this._profiles[this.cell.agentPubKey] = profile;
    this._reversed[profile.nickname] = this.cell.agentPubKey;
    //this._profile_ahs[this.cell.agentPubKey] = encodeHashToBase64(record.signed_action.hashed.hash);
    this.notifySubscribers();
  }

}
