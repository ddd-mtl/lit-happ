import {DnaViewModel, holoIdReviver} from "@ddd-qc/lit-happ";
import {
  AppSignal,
  Signal, SignalCb, SignalType,
} from "@holochain/client";
import {ProfilesZvm} from "./profiles.zvm";
import {ProfilesAltZvm} from "./profilesAlt.zvm";


/**
 * ViewModel fo a DNA holding a Profiles zome
 */
export class ProfilesAltDvm extends DnaViewModel {

  static override readonly DEFAULT_BASE_ROLE_NAME = "profiles";
  static override readonly ZVM_DEFS = [ProfilesAltZvm]
  readonly signalHandler?: SignalCb = this.handleSignal;


  /** QoL Helpers */
  get profilesZvm(): ProfilesAltZvm {
    return this.getZomeViewModel(ProfilesAltZvm.DEFAULT_ZOME_NAME) as ProfilesAltZvm
  }

  /** -- Perspective -- */

  get perspective(): Object {
    return {}
  }


  /** -- Signaling -- */

  /** */
  handleSignal(signal: Signal) {
    //console.log("ProfilesAltDvm Received Signal", signal);
    if (!(SignalType.App in signal)) {
      return;
    }
    const appSignal: AppSignal = signal.App;
    if (appSignal.zome_name !== ProfilesZvm.DEFAULT_ZOME_NAME) {
      return;
    }
  }


  /** -- Import / Export -- */

  /** Dump perspective as JSON */
  exportPerspective(): string {
    const dvmExport: any = {};
    const tJson = this.profilesZvm.export();
    dvmExport[ProfilesZvm.DEFAULT_ZOME_NAME] = JSON.parse(tJson);
    return JSON.stringify(dvmExport, null, 2);
  }


  /** */
  async importPerspective(json: string, canPublish: boolean) {
    const external = JSON.parse(json, holoIdReviver) as any;
    const profiles = external[ProfilesZvm.DEFAULT_ZOME_NAME];
    this.profilesZvm.import(JSON.stringify(profiles), canPublish);
    this.notifySubscribers();
  }


}
