import {AppSignalCb, Timestamp, ZomeName} from "@holochain/client";
import {
  AgentId, CellProxy,
  EntryPulse, LinkPulse, prettyDate,
  TipProtocol, TipProtocolVariantApp, TipProtocolVariantEntry, TipProtocolVariantLink,
  ZomeSignal, ZomeSignalProtocol,
  ZomeSignalProtocolType, ZomeSignalProtocolVariantEntry, ZomeSignalProtocolVariantLink
} from "@ddd-qc/cell-proxy";
import {AppSignal} from "@holochain/client/lib/api/app/types";
import {ZomeViewModel} from "./ZomeViewModel";
import {DnaViewModel} from "./DnaViewModel";

/** */
export interface CastLog {
  ts: Timestamp,
  tip: TipProtocol,
  peers: AgentId[],
}


/**
 * ZVM with support for ZomeSignals
 */
export abstract class ZomeViewModelWithSignals extends ZomeViewModel {

  private _castLogs: CastLog[] = [];

  /** Methods to override */
  protected handleAppTip(_appTip: Uint8Array, _from: AgentId): ZomeSignalProtocol | undefined { return undefined;}
  protected async handleEntryPulse(_pulse: EntryPulse, _from: AgentId): Promise<void> {}
  protected async handleLinkPulse(_pulse: LinkPulse, _from: AgentId): Promise<void> {}


  /** */
  signalHandler?: AppSignalCb = this.mySignalHandler;


  /** */
  private mySignalHandler(appSignal: AppSignal): void {
    const defaultZomeName = (this.constructor as typeof ZomeViewModelWithSignals).ZOME_PROXY.DEFAULT_ZOME_NAME
    console.log("mySignalHandler()", appSignal, defaultZomeName);
    if (appSignal.zome_name !== defaultZomeName) {
      return;
    }
    const zomeSignal = appSignal.payload as ZomeSignal;
    if (!("pulses" in zomeSignal)) {
      return;
    }
    /*await*/ this.handleSignal(zomeSignal);
  }


  /** */
  private async handleSignal(signal: ZomeSignal): Promise<void> {
    const from = new AgentId(signal.from);
    let all = [];
    for (let pulse of signal.pulses) {
      /** -- Handle Signal according to type -- */
      /** Change tip to Entry or Link signal */
      if (ZomeSignalProtocolType.Tip in pulse) {
        pulse = this.handleTip(pulse.Tip as TipProtocol, from)!;
        if (!pulse) {
          continue;
        }
      }
      if (ZomeSignalProtocolType.Entry in pulse) {
        all.push(this.handleEntryPulse(pulse.Entry as EntryPulse, from));
        continue;
      }
      if (ZomeSignalProtocolType.Link in pulse) {
        all.push(this.handleLinkPulse(pulse.Link as LinkPulse, from));
        continue;
      }
    }
    await Promise.all(all);
    this.notifySubscribers();
  }


  /** */
  private handleTip(tip: TipProtocol, from: AgentId): ZomeSignalProtocol | undefined {
    const type = Object.keys(tip)[0];
    console.log("handleTip()", type, from, tip);
    /* Handle tip according to its type */
    switch (type) {
      case "Ping":
      case "Pong":
        break;
      case "Entry": return {Entry: (tip as TipProtocolVariantEntry).Entry} as ZomeSignalProtocolVariantEntry; break;
      case "Link": return {Link: (tip as TipProtocolVariantLink).Link} as ZomeSignalProtocolVariantLink; break;
      case "App":
        return this.handleAppTip((tip as TipProtocolVariantApp).App, from);
        break;
    }
  }


  /** */
  async broadcastTip(tip: TipProtocol, agents?: Array<AgentId>): Promise<void> {
    agents = agents? agents : this._dvmParent.livePeers;
    /** Skip if no recipients or sending to self only */
    const filtered = agents.filter((key) => key.b64 != this.cell.agentId.b64);
    const tipType = Object.keys(tip)[0];
    console.log(`broadcastTip() Sending Tip "${tipType}" to`, filtered, this.cell.agentId.short);
    //if (!agents || agents.length == 1 && agents[0] === this._cellProxy.cell.agentPubKey) {
    if (!filtered || filtered.length == 0) {
      console.log("broadcastTip() aborted: No recipients")
      return;
    }
    /** Broadcast */
    const peers = agents.map((key) => key.hash);
    await this.zomeProxy.call('cast_tip', {tip, peers});
    /** Log */
    this._castLogs.push({ts: Date.now(), tip, peers: agents});
  }


  /** */
  dumpCastLogs() {
    console.warn(`Tips sent from zome "${this.zomeName}"`);
    let appSignals: any[] = [];
    this._castLogs.map((log) => {
      const type = Object.keys(log.tip)[0];
      const payload = (log.tip as any)[type];
      appSignals.push({timestamp: prettyDate(new Date(log.ts)), type, payload, count: log.peers.length, first: log.peers[0]});
    });
    console.table(appSignals);
  }
}
