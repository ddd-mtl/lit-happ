import { AgentPubKey, Record as HcRecord } from '@holochain/client';
import {ZomeProxy} from "@ddd-qc/lit-happ";
import { decode } from "@msgpack/msgpack";


// FIXME delete this file and use ProfilesClient in ZVM instead

export interface FileShareProfile {
  nickname: string;
  fields: Record<string, string>;
}



/**
 *
 */
export class ProfilesProxy extends ZomeProxy {
  static readonly DEFAULT_ZOME_NAME = "profiles"
  static readonly FN_NAMES = [
    "entry_defs",
    'create_profile',
    'update_profile',
    "search_agents",
    "get_agent_profile",
    "get_agents_with_profile",
  ];


  async createProfile(profile: FileShareProfile): Promise<void> {
    return this.callBlocking('create_profile', profile);
  }

  async updateProfile(profile: FileShareProfile): Promise<void> {
    return this.callBlocking('update_profile', profile);
  }

  async searchAgents(nickname_filter: string): Promise<AgentPubKey[]> {
    return this.call('search_agents', {nickname_filter});
  }

  async getAgentProfile(agentPubKey: AgentPubKey): Promise<FileShareProfile | undefined> {
    const record: HcRecord | undefined =  await this.call('get_agent_profile', agentPubKey);
    console.log("getAgentProfile() record", record);
    if (!record) {
      return undefined;
    }
    const entry = (record.entry as any)?.Present?.entry;
    console.log("getAgentProfile() entry", entry);
    return decode(entry) as FileShareProfile;
  }

  async getAgentsWithProfile(): Promise<AgentPubKey[]> {
    return this.call('get_agents_with_profile', null);
  }

}
