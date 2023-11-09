import {delay, DnaViewModel} from "@ddd-qc/lit-happ";
import {
  AppSignal, AppSignalCb,
} from "@holochain/client";
import {NotificationsZvm} from "./notifications.zvm";


/**
 * ViewModel fo a DNA holding only a Notificatiosn zome
 */
export class NotificationsDvm extends DnaViewModel {

  static readonly DEFAULT_BASE_ROLE_NAME = "notifications_test";
  static readonly ZVM_DEFS = [NotificationsZvm]
  readonly signalHandler?: AppSignalCb = this.handleSignal;


  /** QoL Helpers */
  get notificationsZvm(): NotificationsZvm {
    return this.getZomeViewModel(NotificationsZvm.DEFAULT_ZOME_NAME) as NotificationsZvm
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
    if (signal.zome_name !== NotificationsZvm.DEFAULT_ZOME_NAME) {
      return;
    }
  }


}
