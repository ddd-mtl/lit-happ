import {ActionId, ActionIdMap, AgentId, AgentIdMap, assertAllDefined} from "@ddd-qc/cell-proxy";
import {Profile} from "./bindings/profiles.types";
import {ActionHashB64, AgentPubKeyB64, Timestamp} from "@holochain/client";


/** */
export interface ProfilesAltSnapshot {
  all: [AgentPubKeyB64, ActionHashB64, Profile, Timestamp][];
}


/** */
export class ProfilesAltPerspective {
  /* ActionId -> Profile */
  profiles: ActionIdMap<[Profile, Timestamp]> = new ActionIdMap();
  /* AgentId -> ActionId */
  profileByAgent: AgentIdMap<ActionId> = new AgentIdMap();

  /** -- Extra  -- */
  /* Name -> AgentId */
  agentByName: Record<string, AgentId> = {};


  /** -- Methods -- */

  equals(_other: ProfilesAltPerspective) {
    // TODO
    return false;
  }

  /** -- Getters -- */

  get agents(): AgentId[] { return Array.from(this.profileByAgent.keys())}
  get names(): string[] { return Object.keys(this.agentByName)}

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
      agent = this.agentByName[agent];
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
      agent = this.agentByName[agent];
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
    return this.agentByName[nickname];
  }


  /** -- Memento -- */

  /** TODO: deep copy */
  makeSnapshot(): ProfilesAltSnapshot {
    let all: [AgentPubKeyB64, ActionHashB64, Profile, Timestamp][] = [];
    for (const [agentId, profileAh] of this.profileByAgent.entries()) {
      const pair = this.profiles.get(profileAh);
      if (pair) {
        all.push([agentId.b64, profileAh.b64, pair[0], pair[1]])
      }
    }
    /** */
    return {all};
  }
}


/** */
export class ProfilesAltPerspectiveMutable extends ProfilesAltPerspective {

  get readonly(): ProfilesAltPerspective {
    return this;
  }

  /** -- Store -- */

  /** */
  storeProfile(profileAh: ActionId, profile: Profile, ts: Timestamp) {
    console.debug("ProfilesAltZvm.storeProfile()", profileAh.short, profile.nickname);
    assertAllDefined(profileAh, profile, ts);
    this.profiles.set(profileAh, [profile, ts]);
    const agentId = this.getProfileAgent(profileAh);
    if (agentId) {
      this.agentByName[profile.nickname] = agentId;
    }
  }

  /** */
  storeAgentProfile(agentId: AgentId, profileAh: ActionId) {
    console.debug("ProfilesAltZvm.storeAgentProfile()", agentId.short, profileAh.short);
    assertAllDefined(agentId, profileAh);
    this.profileByAgent.set(agentId, profileAh);
    const pair = this.profiles.get(profileAh);
    if (pair) {
      this.agentByName[pair[0].nickname] = agentId;
    }
  }

  /** */
  unstoreAgentProfile(agentId: AgentId, profileAh: ActionId) {
    console.debug("ProfilesAltZvm.unstoreAgentProfile()", agentId.short, profileAh.short);
    assertAllDefined(agentId, profileAh);
    this.profileByAgent.delete(agentId);
    const pair = this.profiles.get(profileAh);
    if (pair) {
      delete this.agentByName[pair[0].nickname];
    }
  }


  /** -- Memento -- */

  /** */
  restore(snapshot: ProfilesAltSnapshot) {
    /** Clear */
    this.profiles.clear();
    this.profileByAgent.clear();
    this.agentByName = {};
    /** Store */
    for (const [agentB64, profileB64, profile, ts] of snapshot.all) {
      const agentId = new AgentId(agentB64);
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
