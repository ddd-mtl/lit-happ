import {DnaViewModel, holoIdReviver} from "@ddd-qc/lit-happ";
import {
  AppSignal,
  Signal, SignalCb, SignalType,
} from "@holochain/client";
import {SharedOwnershipZvm} from "./sharedOwnership.zvm";


/**
 * ViewModel fo a DNA holding a SharedOwnership zome
 */
export class SharedOwnershipDvm extends DnaViewModel {

  static override readonly DEFAULT_BASE_ROLE_NAME = "rSharedOwnership";
  static override readonly ZVM_DEFS = [SharedOwnershipZvm]
  readonly signalHandler?: SignalCb = this.handleSignal;


  /** QoL Helpers */
  get sharedOwnershipZvm(): SharedOwnershipZvm {
    return this.getZomeViewModel(SharedOwnershipZvm.DEFAULT_ZOME_NAME) as SharedOwnershipZvm
  }

  /** -- Perspective -- */

  get perspective(): Object {
    return {}
  }


  /** -- Signaling -- */

  /** */
  handleSignal(signal: Signal) {
    //console.log("ProfilesAltDvm Received Signal", signal);
    if (SignalType.App != signal.type) {
      return;
    }
    const appSignal: AppSignal = signal.value;
    if (appSignal.zome_name !== SharedOwnershipZvm.DEFAULT_ZOME_NAME) {
      return;
    }
  }


  /** -- Import / Export -- */

  /** Dump perspective as JSON */
  exportPerspective(): string {
    const dvmExport: any = {};
    const tJson = this.sharedOwnershipZvm.export();
    dvmExport[SharedOwnershipZvm.DEFAULT_ZOME_NAME] = JSON.parse(tJson);
    return JSON.stringify(dvmExport, null, 2);
  }


  /** */
  async importPerspective(json: string, canPublish: boolean) {
    const external = JSON.parse(json, holoIdReviver) as any;
    const shareds = external[SharedOwnershipZvm.DEFAULT_ZOME_NAME];
    this.sharedOwnershipZvm.import(JSON.stringify(shareds), canPublish);
    this.notifySubscribers();
  }


}
