import {delay, DnaViewModel} from "@ddd-qc/lit-happ";
import {
  Signal, SignalCb, SignalType, AppSignal,
} from "@holochain/client";
import {NotificationsZvm} from "./notifications.zvm";


/**
 * ViewModel fo a DNA holding only a Notificatiosn zome
 */
export class NotificationsDvm extends DnaViewModel {

  static readonly DEFAULT_BASE_ROLE_NAME = "notifications_test";
  static readonly ZVM_DEFS = [NotificationsZvm]
  readonly signalHandler?: SignalCb = this.handleSignal;


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
  handleSignal(signal: Signal) {
    // console.log("Received Signal", signal);
    if (!(SignalType.App in signal)) {
      return;
    }
    const appSignal: AppSignal = signal.App;
    if (appSignal.zome_name !== NotificationsZvm.DEFAULT_ZOME_NAME) {
      return;
    }
  }


}
