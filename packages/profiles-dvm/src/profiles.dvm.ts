import {DnaViewModel} from "@ddd-qc/lit-happ";
import {
  AppSignal,
  Signal, SignalCb, SignalType,
} from "@holochain/client";
import {ProfilesZvm} from "./profiles.zvm";


/** */
// export interface ProfilesDnaPerspective {
//   agentPresences: Record<string, number>,
// }


/**
 * ViewModel fo a DNA holding a Profiles zome
 */
export class ProfilesDvm extends DnaViewModel {

  static override readonly DEFAULT_BASE_ROLE_NAME = "profiles";
  static override readonly ZVM_DEFS = [ProfilesZvm]
  readonly signalHandler?: SignalCb = this.handleSignal;


  /** QoL Helpers */
  get profilesZvm(): ProfilesZvm {
    return this.getZomeViewModel(ProfilesZvm.DEFAULT_ZOME_NAME) as ProfilesZvm;
  }

  /** -- Perspective -- */


  get perspective(): Object {
    return {}
  }


  /** -- Signaling -- */

  /** */
  handleSignal(signal: Signal) {
    //console.log("profilesZvm Received Signal", signal);
    if (!(SignalType.App in signal)) {
      return;
    }
    const appSignal: AppSignal = signal.App;
    if (appSignal.zome_name !== ProfilesZvm.DEFAULT_ZOME_NAME) {
      return;
    }
  }


}
