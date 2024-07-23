import {ActionId, ActionIdMap, AgentId, AgentIdMap} from "@ddd-qc/cell-proxy";
import {Profile} from "./bindings/profiles.types";
import {ActionHashB64, AgentPubKeyB64, Timestamp} from "@holochain/client";
import assert from "assert";

/** */
export interface ProfilesAltPerspectiveCore {
  /* ActionId -> Profile */
  profiles: ActionIdMap<[Profile, Timestamp]>,
  /* AgentId -> ActionId */
  profileByAgent: AgentIdMap<ActionId>,
}


/** */
export interface ProfilesAltSnapshot {
  all: [AgentPubKeyB64, ActionHashB64, Profile, Timestamp][];
}


/** */
export class ProfilesAltPerspective implements ProfilesAltPerspectiveCore {

  /* Core */
  profiles: ActionIdMap<[Profile, Timestamp]> = new ActionIdMap();
  profileByAgent: AgentIdMap<ActionId> = new AgentIdMap();
  /** Extra */
  private _agentByName: Record<string, AgentId> = {};


  // /* */
  // diff(core: ProfilesAltPerspectiveCore): boolean {
  //   // TODO
  //   return true;
  // }


  /** -- Getters -- */

  get agents(): AgentId[] { return Array.from(this.profileByAgent.keys())}
  get names(): string[] { return Object.keys(this._agentByName)}

  /** */
  getProfileAgent(profileId: ActionId): AgentId | undefined {
    for (const [agentId, profId] of this.profileByAgent.entries()) {
      if (profileId.b64 == profId.b64) {
        return agentId;
      }
    }
    return undefined;
  }


  /** */
  getProfile(agent: AgentId | string): Profile | undefined {
    if (typeof agent == "string") {
      agent = this._agentByName[agent];
      if (!agent) {
        return;
      }
    }
    const profileAh = this.profileByAgent.get(agent);
    //console.log("ProfilesAltZvm.getProfile()", agent, profileAh);
    if (!profileAh) {
      return undefined;
    }
    const pair = this.profiles.get(profileAh);
    //console.log("ProfilesAltZvm.getProfile() pair", pair);
    if (!pair) {
      return undefined;
    }
    return pair[0];
  }


  /** */
  getProfileTs(agent: AgentId | string): Timestamp | undefined {
    if (typeof agent == "string") {
      agent = this._agentByName[agent];
      if (!agent) {
        return;
      }
    }
    const profileAh = this.profileByAgent.get(agent);
    if (!profileAh) {
      return undefined;
    }
    const pair = this.profiles.get(profileAh);
    if (!pair) {
      return undefined;
    }
    return pair[1];
  }

  /** */
  getAgent(nickname: string): AgentId | undefined {
      return this._agentByName[nickname];
  }


  /** -- Store -- */

  /** */
  storeProfile(profileAh: ActionId, profile: Profile, ts: Timestamp) {
    console.debug("ProfilesAltZvm.storeProfile()", profileAh.short, profile.nickname);
    assert(profileAh != undefined && profile != undefined, "Missing argument");
    this.profiles.set(profileAh, [profile, ts]);
    const agentId = this.getProfileAgent(profileAh);
    if (agentId) {
      this._agentByName[profile.nickname] = agentId;
    }
  }

  /** */
  storeAgentProfile(agentId: AgentId, profileAh: ActionId) {
    console.debug("ProfilesAltZvm.storeAgentProfile()", agentId.short, profileAh.short);
    assert(agentId != undefined && profileAh != undefined, "Missing argument");
    this.profileByAgent.set(agentId, profileAh);
    const pair = this.profiles.get(profileAh);
    if (pair) {
      this._agentByName[pair[0].nickname] = agentId;
    }
  }

  /** */
  unstoreAgentProfile(agentId: AgentId, profileAh: ActionId) {
    console.debug("ProfilesAltZvm.unstoreAgentProfile()", agentId.short, profileAh.short);
    assert(agentId != undefined && profileAh != undefined, "Missing argument");
    this.profileByAgent.delete(agentId);
    const pair = this.profiles.get(profileAh);
    if (pair) {
      delete this._agentByName[pair[0].nickname];
    }
  }


  /** -- Memento -- */

  /** TODO: deep copy */
  makeSnapshot(): ProfilesAltSnapshot {
    let all = [];
    for (const [agentId, profileAh] of this.profileByAgent.entries()) {
      const pair = this.profiles.get(profileAh);
      if (pair) {
        all.push([agentId, profileAh, pair[0], pair[1]])
      }
    }
    /** */
    return {all}
  }


  /** */
  restore(snapshot: ProfilesAltSnapshot) {
    /** Clear */
    this.profiles.clear();
    this.profileByAgent.clear();
    this._agentByName = {};
    /** */
    for (const [agent, profileB64, profile, ts] of snapshot.all) {
      const agentId = new AgentId(agent);
      const profileAh = new ActionId(profileB64);
      this.storeAgentProfile(agentId, profileAh);
      this.storeProfile(profileAh, profile, ts);
    }
  }


  /** -- Generate -- */

  /** */
  async generateRandomProfile(nickname: string, ts?: Timestamp, fields?: Record<string, string>) {
    const agentId = await AgentId.random();
    const profileAh = await ActionId.random();
    const profile: Profile = {nickname, fields};
    this.storeAgentProfile(agentId, profileAh);
    this.storeProfile(profileAh, profile, ts? ts : 0);
  }

}
