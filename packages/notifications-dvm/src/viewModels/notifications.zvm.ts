import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {AgentPubKey, AgentPubKeyB64, decodeHashFromBase64, encodeHashToBase64} from "@holochain/client";
import {NotificationsProxy} from "../bindings/notifications.proxy";
import {AgentPubKeyWithTag, Contact, NotificationTip, TwilioCredentials} from "../bindings/notifications.types";
import {Record as HcRecord} from "@holochain/client/lib/hdk/record";
import {CpuInfo} from "os";


/** */
export interface NotificationsPerspective {
  notifiers: AgentPubKeyWithTag[],
  contacts: Record<AgentPubKeyB64, Contact>,

  myNotifier?: AgentPubKey,
  myTwilioCredentials?: TwilioCredentials,
}


/**
 *
 */
export class NotificationsZvm extends ZomeViewModel {

  static readonly ZOME_PROXY = NotificationsProxy;
  get zomeProxy(): NotificationsProxy {return this._zomeProxy as NotificationsProxy;}


  /* */
  protected hasChanged(): boolean {
    // TODO
    return true;
  }


  /** */
  async initializePerspectiveOnline(): Promise<void> {
    // FIXME
  }

  /** */
  probeAllInner() {
    /* await */ this.probeNotifiers();
    /* await */ this.probeMyNotifier();
    /* await */ this.probeMyTwilioCredentials();
  }


  /** */
  async probeMyTwilioCredentials() {
    // FIXME unpack HcRecord
    //this._myTwilioCredentials = await this.zomeProxy.getTwilioCredentials();
    //this.notifySubscribers();
  }


  /** */
  async probeMyNotifier() {
    this._myNotifier = await this.zomeProxy.getMyNotifier();
    this.notifySubscribers();
  }


  /** */
  async probeNotifiers() {
    this._notifiers = await this.zomeProxy.listNotifiers();
    this.notifySubscribers();
  }

  /** -- Perspective -- */

  /* */
  get perspective(): NotificationsPerspective {
    return {
      notifiers: this._notifiers,
      contacts: this._contacts,
      myNotifier: this._myNotifier,
      myTwilioCredentials: this._myTwilioCredentials,
    };
  }

  private _notifiers: AgentPubKeyWithTag[] = []
  private _contacts: Record<AgentPubKeyB64, Contact> = {}
  private _myNotifier?: AgentPubKey;
  private _myTwilioCredentials?: TwilioCredentials;

  getMyContact(): Contact | undefined { return this._contacts[this.cell.agentPubKey] }

  getContact(agent: AgentPubKeyB64): Contact | undefined {return this._contacts[agent]}


  /** -- Methods -- */

  /** */
  async createMyContact(text_number?: string, whatsapp_number?: string, email_address?: string) {
    const contact = {
      agent_pub_key: decodeHashFromBase64(this.cell.agentPubKey),
      text_number,
      whatsapp_number,
      email_address,
    } as Contact;
    const _record = await this.zomeProxy.createContact(contact);
    this._contacts[this.cell.agentPubKey] = contact;
    this.notifySubscribers();
  }


  /** */
  async probeContacts(agents: AgentPubKeyB64[]) {
    const contacts = await this.zomeProxy.getContacts(agents.map((agent) => decodeHashFromBase64(agent)));
    for (const contact of contacts) {
      this._contacts[encodeHashToBase64(contact.agent_pub_key)] = contact;
    }
    this.notifySubscribers();
  }


  /** */
  async sendNotification(message: string, notificant: AgentPubKeyB64): Promise<void> {
    const tip = {
      retry_count: 5,
      status: "",
      message,
      notificants: [decodeHashFromBase64(notificant)],
      contacts: [],
      extra_context: "",
      message_id: "",
      destination: "",
    } as NotificationTip;
    await this.zomeProxy.sendNotificationTip(tip);
  }

}
