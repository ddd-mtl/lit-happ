import {
    AgentPubKey,
    AppClient,
    AppEvents,
    AppInfoResponse,
    SignalCb,
    CallZomeRequest,
    ClonedCell,
    CreateCloneCellResponse,
    DisableCloneCellRequest,
    EnableCloneCellRequest,
    InstalledAppId,
    CreateCloneCellRequest,
    DumpNetworkStatsResponse,
    DumpNetworkMetricsRequest,
    DumpNetworkMetricsResponse,
} from "@holochain/client";
import { UnsubscribeFunction } from "emittery";


/**
 * Adapt ProfilesClient to AppClient interface
 */
export class ProfilesApi implements AppClient {

  /* WARN: We don't want a dep to Profiles, so manually make sure API is in check!  */
  constructor(private _profilesClient: any /* ProfilesClient */ ) {
    this.appClient = _profilesClient.client;
    // this.roleName = _profilesClient.roleName;
    // this.zomeName = _profilesClient.zomeName;
    this.myPubKey = _profilesClient.client.myPubKey;
    this.installedAppId = _profilesClient.client.installedAppId;
  }

  /** -- AppClient -- */

  appClient: AppClient
  // roleName: RoleName
  // zomeName: String
  myPubKey: AgentPubKey;
  installedAppId: InstalledAppId;

  /** Undo crap by ProfilesClient */
  async callZome(req: CallZomeRequest, _timeout?: number): Promise<unknown> {
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
    listener: SignalCb,
  ): UnsubscribeFunction {
    return this.appClient.on(eventName, listener);
  }


  async appInfo(): Promise<AppInfoResponse> {
    const res = await this.appClient.appInfo();
    // if (res.installed_app_id != args.installed_app_id) {
    //   throw new Error("Unknown appId requested");
    // }
    return res;
  }

  async createCloneCell(request: CreateCloneCellRequest): Promise<CreateCloneCellResponse> {
    //console.log("enableCloneCell() called:", request)
    return this.appClient.createCloneCell(request);
  }

  async enableCloneCell(request: EnableCloneCellRequest): Promise<ClonedCell> {
    //console.log("enableCloneCell() called:", request)
    return this.appClient.enableCloneCell(request);
  }

  async disableCloneCell(request: DisableCloneCellRequest): Promise<void> {
    //console.log("disableCloneCell() called:", request)
    return this.appClient.disableCloneCell(request);
  }


  async dumpNetworkStats(_timeout?: number): Promise<DumpNetworkStatsResponse> {
    return this.appClient.dumpNetworkStats();
  }

  async dumpNetworkMetrics(
    req: DumpNetworkMetricsRequest,
    _timeout?: number
  ): Promise<DumpNetworkMetricsResponse> {
    return this.appClient.dumpNetworkMetrics(req);
  }

}
