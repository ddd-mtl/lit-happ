import {
  AgentPubKey,
  AppClient, AppCreateCloneCellRequest, AppEvents,
  AppInfoResponse, AppNetworkInfoRequest, AppSignalCb, CallZomeRequest, ClonedCell, CreateCloneCellResponse,
  DisableCloneCellRequest,
  EnableCloneCellRequest, InstalledAppId, NetworkInfoResponse,
} from "@holochain/client";
import { UnsubscribeFunction } from "emittery";
import {ProfilesClient} from "@holochain-open-dev/profiles";


/**
 * Adapt ProfilesClient to AppClient interface
 */
export class ProfilesApi implements AppClient {

  constructor(private _profilesClient: ProfilesClient/*, public appId: InstalledAppId*/) { }

  /** -- AppClient -- */

  myPubKey: AgentPubKey;
  installedAppId: InstalledAppId;

  /** Undo crap by ProfilesClient */
  async callZome(req: CallZomeRequest, timeout?: number): Promise<unknown> {
    if (req.zome_name != "profiles") {
      throw new Error("Unknown zome_name requested");
    }
    switch(req.fn_name) {
      case 'create_profile':
        const maybeCreate = await this._profilesClient.createProfile(req.payload);
        if (!maybeCreate) {
          return undefined;
        }
        return maybeCreate.record;
        break;
      case 'update_profile':
        const maybe = await this._profilesClient.updateProfile(req.payload);
        if (!maybe) {
          return undefined;
        }
        return maybe.record;
        break;
      case 'get_agents_with_profile':
        return this._profilesClient.getAgentsWithProfile();
        break;
      case 'get_agent_profile':
        //return this._profilesClient.getAgentProfile(req.payload);
        const maybeProfile = await this._profilesClient.getAgentProfile(req.payload);
        if (!maybeProfile) {
          return undefined;
        }
        return maybeProfile.record;
        break;
      case 'search_agents':
        return this._profilesClient.searchAgents(req.payload);
        break;
    }
    throw new Error("Unknown fn_name requested");
  }

  on<Name extends keyof AppEvents>(
    eventName: Name | readonly Name[],
    listener: AppSignalCb,
  ): UnsubscribeFunction {
    return this._profilesClient.client.on(eventName, listener);
  }


  async appInfo(): Promise<AppInfoResponse> {
    const res = await this._profilesClient.client.appInfo();
    // if (res.installed_app_id != args.installed_app_id) {
    //   throw new Error("Unknown appId requested");
    // }
    return res;
  }

  async createCloneCell(request: AppCreateCloneCellRequest): Promise<CreateCloneCellResponse> {
    //console.log("enableCloneCell() called:", request)
    return this._profilesClient.client.createCloneCell(request);
  }

  async enableCloneCell(request: EnableCloneCellRequest): Promise<ClonedCell> {
    //console.log("enableCloneCell() called:", request)
    return this._profilesClient.client.enableCloneCell(request);
  }

  async disableCloneCell(request: DisableCloneCellRequest): Promise<void> {
    //console.log("disableCloneCell() called:", request)
    return this._profilesClient.client.disableCloneCell(request);
  }

  networkInfo(args: AppNetworkInfoRequest): Promise<NetworkInfoResponse> {
    return this._profilesClient.client.networkInfo(args);
  }

}
