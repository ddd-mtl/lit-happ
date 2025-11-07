import {SignalCb} from "@holochain/client";
import {DnaViewModel, ZvmDef} from "@ddd-qc/lit-happ";
import {AgentDirectoryZvm} from "@ddd-qc/agent-directory"
import {PathExplorerZvm} from "@ddd-qc/path-explorer";
import {TaskerZvm} from "./tasker.zvm"
import {ProfilesAltZvm} from "@ddd-qc/profiles-dvm";


/**
 * TODO: Make a "passthrough" DVM generator in dna-client based on ZVM_DEFS
 */
 export class TaskerDvm extends DnaViewModel {

  /** -- DnaViewModel Interface -- */

  static override readonly DEFAULT_BASE_ROLE_NAME = "rTasker";
  static override readonly ZVM_DEFS: ZvmDef[] = [
   TaskerZvm,
   PathExplorerZvm,
   [AgentDirectoryZvm, "zAgentDirectory"],
   [ProfilesAltZvm, "profiles"],
  ];

  readonly signalHandler?: SignalCb;


  /** QoL Helpers */
  get taskerZvm(): TaskerZvm {return this.getZomeViewModel(TaskerZvm.DEFAULT_ZOME_NAME) as TaskerZvm}
  get pathExplorerZvm(): PathExplorerZvm {return this.getZomeViewModel("zPathExplorer") as PathExplorerZvm}
  get AgentDirectoryZvm(): AgentDirectoryZvm {return this.getZomeViewModel("zAgentDirectory") as AgentDirectoryZvm}
  get profilesZvm(): ProfilesAltZvm {return this.getZomeViewModel("profiles") as ProfilesAltZvm}


  /** -- ViewModel Interface -- */

  get perspective(): Object {return {}}


  /** -- */

  // protected async dvmUpdated(newDvm: TaskerDvm, oldDvm?: TaskerDvm): Promise<void> {
  //  const dummyProfile: ProfileDef = {
  //    nickname: "camille",
  //    fields: {},
  //  }
  //  console.log("taskerDvm.dvmUpdated()", dummyProfile);
  //  newDvm.profilesZvm.createMyProfile(dummyProfile);
  // }

}
