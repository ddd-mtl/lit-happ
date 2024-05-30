import {delay, DnaViewModel} from "@ddd-qc/lit-happ";
import {
  AppSignal, AppSignalCb,
} from "@holochain/client";
import {ProfilesZvm} from "./profiles.zvm";
import {ProfilesAltZvm} from "./profilesAlt.zvm";

/** */
// export interface ProfilesDnaPerspective {
//   agentPresences: Record<string, number>,
// }


/**
 * ViewModel fo a DNA holding a Profiles zome
 */
export class ProfilesDvm extends DnaViewModel {

  static readonly DEFAULT_BASE_ROLE_NAME = "profiles";
  static readonly ZVM_DEFS = [ProfilesAltZvm]
  readonly signalHandler?: AppSignalCb = this.handleSignal;


  /** QoL Helpers */
  get profilesZvm(): ProfilesAltZvm {
    return this.getZomeViewModel(ProfilesAltZvm.DEFAULT_ZOME_NAME) as ProfilesAltZvm
  }

  /** -- Perspective -- */

  protected hasChanged(): boolean {
    return true
  }

  get perspective(): unknown {
    return {}
  }


  /** -- Signaling -- */

  /** */
  handleSignal(signal: AppSignal) {
    console.log("Received Signal", signal);
    if (signal.zome_name !== ProfilesZvm.DEFAULT_ZOME_NAME) {
      return;
    }
  }


}
