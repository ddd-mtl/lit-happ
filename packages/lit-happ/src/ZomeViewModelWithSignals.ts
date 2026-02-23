import {SignalCb, EntryVisibility, Timestamp, ZomeIndex, Signal, SignalType, AppSignal} from "@holochain/client";
import {
  ActionId,
  AgentId,
  LinkableId,
  anyToB64,
  enc64,
  EntryId,
  EntryPulse,
  getIndexByVariant,
  intoLinkableId,
  LinkPulse,
  prettyDate,
  prettyState,
  SignalLog,
  AppSignalType,
  StateChange,
  TipProtocol,
  TipProtocolVariantEntry,
  TipProtocolVariantLink,
  ZomeSignal,
  ZomeSignalProtocol,
  ZomeSignalProtocolType,
  ZomeSignalProtocolVariantEntry,
  ZomeSignalProtocolVariantLink,
  TipProtocolType,
  intoAnyId,
  ValidatedBy, SynchronizeTipInput, TipProtocolVariantAppValue, TipProtocolVariantAppCustom,
} from "@ddd-qc/cell-proxy";
import {ZomeViewModel} from "./ZomeViewModel";
import {decode} from "@msgpack/msgpack";


/** */
export interface CastLog {
  ts: Timestamp,
  tip: TipProtocol,
  peers: AgentId[],
  response: Timestamp | undefined,
}


/**
 * ZVM with support for ZomeSignals
 */
export abstract class ZomeViewModelWithSignals extends ZomeViewModel {

  private _castLogs: CastLog[] = [];

  /** Methods to override */
  protected handleCustomTip(_customTip: Uint8Array, _from: AgentId): ZomeSignalProtocol | undefined { return undefined;}
  protected handleValueTip(_key: string, _value: string, _from: AgentId): ZomeSignalProtocol | undefined { return undefined;}
  protected async handleEntryPulse(_pulse: EntryPulseMat, _from: AgentId): Promise<void> {}
  protected async handleLinkPulse(_pulse: LinkPulseMat, _from: AgentId): Promise<void> {}


  /** */
  override signalHandler?: SignalCb = this.mySignalHandler;


  /** */
  private mySignalHandler(signal: Signal): void {
    const defaultZomeName = (this.constructor as typeof ZomeViewModelWithSignals).ZOME_PROXY.DEFAULT_ZOME_NAME;
    //console.log("mySignalHandler()", appSignal, defaultZomeName);
    if (SignalType.App != signal.type) {
      return;
    }
    const appSignal: AppSignal = signal.value;
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
          if (entryPulseMat.isNew && this.cell.address.agentId.equals(from) && entryPulseMat.visibility == "Public") {
            this.broadcastTip({Entry: pulse.Entry as EntryPulse});
          }
        continue;
      }
      if (ZomeSignalProtocolType.Link in pulse) {
        const linkPulseMat = materializeLinkPulse(pulse.Link as LinkPulse, (this.constructor as typeof ZomeViewModel).LINK_TYPES);
        all.push(this.handleLinkPulse(linkPulseMat, from));
        /** If new Link from this agent, broadcast to peers as tip */
        if (linkPulseMat.isNew && this.cell.address.agentId.equals(from)) {
          this.broadcastTip({Link: pulse.Link as LinkPulse});
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
      case "AppValue":
        const key = (tip as TipProtocolVariantAppValue).AppValue[0];
        const value = (tip as TipProtocolVariantAppValue).AppValue[1];
        return this.handleValueTip(key, value, from);
        break;
      case "AppCustom":
        return this.handleCustomTip((tip as TipProtocolVariantAppCustom).AppCustom, from);
        break;
    }
    return undefined;
  }


  /** */
  synchronizeValueTip(key: string, value: string, recipient: AgentId, zomeName: string): void {
    /* Only MainView can cast tips */
    if (!this.isMainView) {
      return;
    }
    console.debug(`synchronizeValueTip() Sending to`, recipient, zomeName);
    const tip: TipProtocol = {AppValue: [key, value]};
    this.zomeProxy.call('synchronize_tip', {tip, recipient: recipient.hash, zomeName} as SynchronizeTipInput)
        .then((response) => this._castLogs.push({ts: Date.now(), tip, peers: [recipient], response}))
        .catch((e) => {console.warn("zome call to synchronize_tip() failed: ", e)})
  }


  /** */
  synchronizeCustomTip(appTip: Uint8Array, recipient: AgentId, zomeName: string): void {
    /* Only MainView can cast tips */
    if (!this.isMainView) {
      return;
    }
    console.debug(`synchronizeCustomTip() Sending to`, recipient, zomeName);
    const tip: TipProtocol = {AppCustom: appTip};
    this.zomeProxy.call('synchronize_tip', {tip,  recipient: recipient.hash, zomeName} as SynchronizeTipInput)
      .then((response) => this._castLogs.push({ts: Date.now(), tip, peers: [recipient], response}))
      .catch((e) => {console.warn("zome call to synchronize_tip() failed: ", e)})
  }


  /** Cast Tip to all known livePeers */
  broadcastTip(tip: TipProtocol, agents?: Array<AgentId>): void {
    /** Only MainView can cast tips */
    if (!this.isMainView) {
      return;
    }
    agents = agents? agents : this._dvmParent.livePeers;
    /** Skip if no recipients or sending to self only */
    const filtered = agents.filter((key) => key.b64 != this.cell.address.agentId.b64);
    const tipType = Object.keys(tip)[0];
    console.debug(`broadcastTip() Sending Tip "${tipType}" to`, filtered, this.cell.address.agentId.short);
    //if (!agents || agents.length == 1 && agents[0] === this._cellProxy.cell.agentPubKey) {
    if (!filtered || filtered.length == 0) {
      console.debug("broadcastTip() aborted: No recipients")
      return;
    }
    /** Broadcast */
    const peers = agents.map((key) => key.hash);
    this.zomeProxy.call('cast_tip', {tip, peers})
        .then(() => this._castLogs.push({ts: Date.now(), tip, peers: agents, response: undefined}))
        .catch((e) => {console.warn("zome call to cast_tip() failed: ", e)})
  }


  /** */
  dumpCastLogs() {
    console.warn(`Tips sent from zome "${this.zomeName}"`);
    let appSignals: any[] = [];
    this._castLogs.map((log) => {
      const type = Object.keys(log.tip)[0]!;
      const payload = (log.tip as any)[type];
      appSignals.push({
        timestamp: prettyDate(new Date(log.ts)),
        type,
        payload,
        count: log.peers.length,
        first: log.peers[0]? log.peers[0].short : undefined,
        response: log.response });
    });
    console.table(appSignals);
  }


  private tip2Log(tip: TipProtocol, type: TipProtocolType): [string, string] {
    switch (type) {
      case TipProtocolType.Ping:
      case TipProtocolType.Pong: return ["", ""]; break;
      case TipProtocolType.AppValue: {
        const [key, value] = (tip as TipProtocolVariantAppValue).AppValue;
        return [key, value];
      }
        break;
      case TipProtocolType.AppCustom: {
        const app = (tip as TipProtocolVariantAppCustom).AppCustom;
        return ["" + app.length, ""];
      }
      break;
      case TipProtocolType.Entry: {
        const entryPulse = (tip as TipProtocolVariantEntry).Entry;
        return [intoAnyId(entryPulse.ah).short, intoAnyId(entryPulse.eh).short];
      }
      break;
      case TipProtocolType.Link: {
        const linkPulse = (tip as TipProtocolVariantLink).Link;
        return [intoAnyId(linkPulse.link.base).short, intoAnyId(linkPulse.link.target).short];
      }
      break;
    }
  }


  /** */
  override dumpSignalLogs(signalLogs: SignalLog[]) {
    this.dumpCastLogs();
    console.warn(`Signals received from zome "${this.zomeName}"`);
    let appSignals: any[] = [];
    signalLogs
      .filter((log) => log.type == AppSignalType.Zome)
      .map((log) => {
        const signal = log.zomeSignal as ZomeSignal;
        const pulses = signal.pulses as ZomeSignalProtocol[];
        const timestamp = prettyDate(new Date(log.ts));
        const from: string = enc64(signal.from) == this.cell.address.agentId.b64? "self" : new AgentId(signal.from).short;
        for (const pulse of pulses) {
          if (ZomeSignalProtocolType.Tip in pulse) {
            const tip: TipProtocol = pulse.Tip;
            const type = Object.keys(tip)[0];
            const [ah_base, eh_target] = this.tip2Log(tip, type as TipProtocolType);
            appSignals.push({timestamp, from, pulse: ZomeSignalProtocolType.Tip, type, payload: anyToB64(tip), ah_base, eh_target});
          }
          if (ZomeSignalProtocolType.Entry in pulse) {
            const entryPulse = materializeEntryPulse(pulse.Entry, Object.values(this.zomeProxy.entryTypes));
            const typedEntry = decode(entryPulse.bytes);
            appSignals.push({timestamp, from, pulse: ZomeSignalProtocolType.Entry, state: prettyState(pulse.Entry.state), type: entryPulse.entryType, payload: anyToB64(typedEntry), ah_base: entryPulse.ah.short, eh_target: entryPulse.eh.short});
          }
          if (ZomeSignalProtocolType.Link in pulse) {
            const linkPulse = materializeLinkPulse(pulse.Link, Object.values(this.zomeProxy.linkTypes));
            appSignals.push({timestamp, from, pulse: ZomeSignalProtocolType.Link, state: prettyState(pulse.Link.state), type: linkPulse.link_type, payload: linkPulse.tag, ah_base: linkPulse.base.print(), eh_target: linkPulse.target.print()});
          }
        }
      });
    console.table(appSignals);
  }
}


/** -- Materialze -- */

export interface EntryPulseMat {
  origAh: ActionId | null,
  ah: ActionId,
  state: string,
  validatedBy: ValidatedBy,
  isNew: boolean,
  ts: Timestamp,
  author: AgentId,
  eh: EntryId,
  entryType: string,
  visibility: EntryVisibility,
  bytes: Uint8Array,
}


/** */
export function materializeEntryPulse(entryPulse: EntryPulse, entryTypes: string[]): EntryPulseMat {
  //console.log("materializeEntryPulse()", entryTypes);
  const stateStr = Object.keys(entryPulse.state)[0]!;
  return {
    origAh: entryPulse.orig_ah? new ActionId(entryPulse.orig_ah) : null,
    ah: new ActionId(entryPulse.ah),
    state: stateStr,
    validatedBy: entryPulse.validation,
    isNew: (entryPulse.state as any)[stateStr],
    ts: entryPulse.ts,
    author: new AgentId(entryPulse.author),
    eh: new EntryId(entryPulse.eh),
    entryType: entryTypes[entryPulse.def.entry_index]!,
    visibility: entryPulse.def.visibility,
    bytes: entryPulse.bytes,
  }
}


/** */
export function dematerializeEntryPulse(pulse: EntryPulseMat, entryTypes: string[]): EntryPulse {
  let state: Object = {};
  // @ts-ignore
  state[pulse.state] = pulse.isNew;
  //console.log("dematerializeEntryPulse()", state, entryTypes);
  /** */
  let res: EntryPulse = {
    ah: pulse.ah.hash,
    state: state as StateChange,
    validation: pulse.validatedBy,
    ts: pulse.ts,
    author: pulse.author.hash,
    eh: pulse.eh.hash,
    def: {
      entry_index: getIndexByVariant(entryTypes, pulse.entryType),
      zome_index: 42, // Should not be used
      visibility: pulse.visibility,
    },
    bytes: pulse.bytes,
  }
  if (pulse.origAh) {
    res.orig_ah = pulse.origAh.hash
  }
  return res;
}


/** */
export interface LinkPulseMat {
  author: AgentId,
  base: LinkableId;
  target: LinkableId,
  timestamp: Timestamp,
  zome_index: ZomeIndex,
  link_type: string,
  tag: Uint8Array,
  create_link_hash: ActionId,
  /** */
  state: string,
  validatedBy: ValidatedBy,
  isNew: Boolean,
}

/** */
export function materializeLinkPulse(linkPulse: LinkPulse, linkTypes: string[]): LinkPulseMat {
  //console.log("materializeLinkPulse()", linkTypes);
  const stateStr = Object.keys(linkPulse.state)[0]!;
  return {
    author: new AgentId(linkPulse.link.author),
    base: intoLinkableId(linkPulse.link.base),
    target: intoLinkableId(linkPulse.link.target),
    timestamp: linkPulse.link.timestamp,
    zome_index: linkPulse.link.zome_index,
    link_type: linkTypes[linkPulse.link.link_type]!,
    tag: linkPulse.link.tag,
    create_link_hash: new ActionId(linkPulse.link.create_link_hash),
    state: Object.keys(linkPulse.state)[0]!,
    validatedBy: linkPulse.validation,
    isNew: (linkPulse.state as any)[stateStr],
  }
}

/** */
export function dematerializeLinkPulse(pulse: LinkPulseMat, linkTypes: string[]): LinkPulse {
  let state: Object = {};
  // @ts-ignore
  state[pulse.state] = pulse.isNew;
  //console.log("dematerializeLinkPulse()", state);
  /** */
  return {
    state: state as StateChange,
    validation: pulse.validatedBy,
    link: {
      author: pulse.author.hash,
      base:  pulse.base.hash,
      target: pulse.target.hash,
      timestamp: pulse.timestamp,
      zome_index: pulse.zome_index,
      link_type: getIndexByVariant(linkTypes, pulse.link_type),
      tag: pulse.tag,
      create_link_hash: pulse.create_link_hash.hash,
    }
  }
}
