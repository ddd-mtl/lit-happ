import {
  AppApi, AppInfoRequest, AppInfoResponse, CallZomeRequest, ClonedCell,
  DisableCloneCellRequest,
  EnableCloneCellRequest,
} from "@holochain/client";
import {ProfilesClient} from "@holochain-open-dev/profiles";


/**
 * Adapt ProfilesClient to AppApi interface
 */
export class ProfilesApi implements AppApi {

  constructor(private _profilesClient: ProfilesClient/*, public appId: InstalledAppId*/) { }


  async enableCloneCell(request: EnableCloneCellRequest): Promise<ClonedCell> {
    //console.log("enableCloneCell() called:", request)
    return this._profilesClient.client.enableCloneCell(request);
  }

  async disableCloneCell(request: DisableCloneCellRequest): Promise<void> {
    //console.log("disableCloneCell() called:", request)
    return this._profilesClient.client.disableCloneCell(request);
  }


  async appInfo(args: AppInfoRequest): Promise<AppInfoResponse> {
    const res = await this._profilesClient.client.appInfo();
    if (res.installed_app_id != args.installed_app_id) {
      throw new Error("Unknown appId requested");
    }
    return res;
  }


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
}
