import {AppSignalCb, Timestamp} from "@holochain/client";
import {
  ActionId,
  AgentId, AnyLinkableId, EntryId,
  EntryPulse, getIndexByVariant, intoLinkableId, LinkPulse, prettyDate, StateChange,
  TipProtocol, TipProtocolVariantApp, TipProtocolVariantEntry, TipProtocolVariantLink,
  ZomeSignal, ZomeSignalProtocol,
  ZomeSignalProtocolType, ZomeSignalProtocolVariantEntry, ZomeSignalProtocolVariantLink
} from "@ddd-qc/cell-proxy";
import {AppSignal} from "@holochain/client/lib/api/app/types";
import {ZomeViewModel} from "./ZomeViewModel";
import {ZomeIndex} from "@holochain/client/lib/hdk/link";


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
  protected async handleEntryPulse(_pulse: EntryPulseMat, _from: AgentId): Promise<void> {}
  protected async handleLinkPulse(_pulse: LinkPulseMat, _from: AgentId): Promise<void> {}


  /** */
  signalHandler?: AppSignalCb = this.mySignalHandler;


  /** */
  private mySignalHandler(appSignal: AppSignal): void {
    const defaultZomeName = (this.constructor as typeof ZomeViewModelWithSignals).ZOME_PROXY.DEFAULT_ZOME_NAME;
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
        const entryPulseMat = materializeEntryPulse(pulse.Entry as EntryPulse, (this.constructor as typeof ZomeViewModel).ENTRY_TYPES);
        all.push(this.handleEntryPulse(entryPulseMat, from));
        /** If new entry from this agent, broadcast to peers as tip */
        if (entryPulseMat.isNew && from.b64 == this.cell.agentId.b64) {
          all.push(this.broadcastTip({Entry: pulse.Entry as EntryPulse}));
        }
        continue;
      }
      if (ZomeSignalProtocolType.Link in pulse) {
        const linkPulseMat = materializeLinkPulse(pulse.Link as LinkPulse, (this.constructor as typeof ZomeViewModel).LINK_TYPES);
        all.push(this.handleLinkPulse(linkPulseMat, from));
        /** If new Link from this agent, broadcast to peers as tip */
        if (linkPulseMat.isNew && from.b64 == this.cell.agentId.b64) {
          all.push(this.broadcastTip({Link: pulse.Link as LinkPulse}));
        }
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


export interface EntryPulseMat {
  ah: ActionId,
  state: string,
  isNew: Boolean,
  ts: Timestamp,
  author: AgentId,
  eh: EntryId,
  entryType: string,
  bytes: Uint8Array,
}


/** */
export function materializeEntryPulse(entryPulse: EntryPulse, entryTypes: string[]): EntryPulseMat {
  //console.log("materializeEntryPulse()", entryTypes);
  const stateStr = Object.keys(entryPulse.state)[0];
  return {
    ah: new ActionId(entryPulse.ah),
    state: stateStr,
    isNew: (entryPulse.state as any)[stateStr],
    ts: entryPulse.ts,
    author: new AgentId(entryPulse.author),
    eh: new EntryId(entryPulse.eh),
    entryType: entryTypes[entryPulse.def.entry_index],
    bytes: entryPulse.bytes,
  }
}


/** */
export function dematerializeEntryPulse(pulse: EntryPulseMat, entryTypes: string[]): EntryPulse {
  let state: Object = {};
  state[pulse.state] = pulse.isNew;
  //console.log("dematerializeEntryPulse()", state, entryTypes);
  /** */
  return {
    ah: pulse.ah.hash,
    state: state as StateChange,
    ts: pulse.ts,
    author: pulse.author.hash,
    eh: pulse.eh.hash,
    def: {
      entry_index: getIndexByVariant(entryTypes, pulse.entryType),
      zome_index: 0, // Should not be used
      visibility: "Public", // Should not be used, or grab actual value in EntryDefs
    },
    bytes: pulse.bytes,
  }
}


/** */
export interface LinkPulseMat {
  author: AgentId,
  base: AnyLinkableId;
  target: AnyLinkableId,
  timestamp: Timestamp,
  zome_index: ZomeIndex,
  link_type: string,
  tag: Uint8Array,
  create_link_hash: ActionId,
  /** */
  state: string,
  isNew: Boolean,
}

/** */
export function materializeLinkPulse(linkPulse: LinkPulse, linkTypes: string[]): LinkPulseMat {
  console.log("materializeLinkPulse()", linkTypes);
  const stateStr = Object.keys(linkPulse.state)[0];
  return {
    author: new AgentId(linkPulse.link.author),
    base: intoLinkableId(linkPulse.link.base),
    target: intoLinkableId(linkPulse.link.target),
    timestamp: linkPulse.link.timestamp,
    zome_index: linkPulse.link.zome_index,
    link_type: linkTypes[linkPulse.link.link_type],
    tag: linkPulse.link.tag,
    create_link_hash: new ActionId(linkPulse.link.create_link_hash),
    state: Object.keys(linkPulse.state)[0],
    isNew: (linkPulse.state as any)[stateStr],
  }
}

/** */
export function dematerializeLinkPulse(pulse: LinkPulseMat, linkTypes: string[]): LinkPulse {
  let state: Object = {};
  state[pulse.state] = pulse.isNew;
  console.log("dematerializeLinkPulse()", state);
  /** */
  return {
    state: state as StateChange,
    link: {
      author: pulse.author.hash,
      base: pulse.base.hash,
      target: pulse.target.hash,
      timestamp: pulse.timestamp,
      zome_index: pulse.zome_index,
      link_type: getIndexByVariant(linkTypes, pulse.link_type),
      tag: pulse.tag,
      create_link_hash: pulse.create_link_hash.hash,
    }
  }
}
