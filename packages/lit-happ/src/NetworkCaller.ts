import {AppProxy, CellAddress, prettyDate, RingBuffer} from "@ddd-qc/cell-proxy";
import {DhtArc, DumpNetworkMetricsRequest, FetchStateSummary, NetworkMetrics, Timestamp} from "@holochain/client";

type NetworkInfoCb = (info:NetworkMetrics) => void;


/**
 * Class handling network info calling and result storing
 */
export class NetworkCaller {

  /** */
  constructor(private appProxy: AppProxy, private cellAddr?: CellAddress) {
    // N/A
  }


  private _lastTimeQueried: Timestamp = 0;
  private _networkMetricsLogs: RingBuffer<[Timestamp, NetworkMetrics]> = new RingBuffer(50);

  private _intervalId: any | undefined = undefined;

  private _callbacks: NetworkInfoCb[] = [];

  /** -- Getters & Setters -- */

  setCellAddr(cellAddr: CellAddress) { this.cellAddr = cellAddr};

  setCapacity(n: number) {
    this._networkMetricsLogs.resize(n);
  }

  get networkMetricsLogs(): [Timestamp, NetworkMetrics][] {return this._networkMetricsLogs.toArray();}


  /** -- Methods -- */

  /** */
  isLooping(): boolean {
    const isUnd = this._intervalId === undefined;
    return !isUnd;
  }

  /** */
  startCallLoop(interval: number) {
    if (this.isLooping()) {
      this.stopCallLoop();
    }
    this._intervalId = setInterval(async () => {
      //console.log("Requesting network info...");
      const res = await this.callNetworkMetrics();
      for (const callback of this._callbacks) {
        callback(res);
      }
    }, interval);
  }


  /** */
  addCallback(callback: (n: NetworkMetrics) => void) {
    this._callbacks.push(callback);
  }

  /** */
  clearAllCallbacks() {
    this._callbacks = [];
  }

  /** */
  stopCallLoop() {
    clearInterval(this._intervalId);
    this._intervalId = undefined;
  }


  /** */
  clear() {
    this._networkMetricsLogs.clear();
  }


  /** */
  async callNetworkMetrics(): Promise<NetworkMetrics> {
    if (!this.cellAddr) {
      throw Promise.reject("callNetworkMetrics() aborted. cellAddr not specified.");
    }
    /* Call networkInfo */
    const response = await this.appProxy.dumpNetworkMetrics({
      dna: this.cellAddr.dnaId.hash,
      include_dht_summary: true, // ???
    } as DumpNetworkMetricsRequest);
    if (!response || !response[this.cellAddr.dnaId.b64]) {
      throw Promise.reject("No network metrics response for dna");
    }
    /* Store */
    const dnaResp = response[this.cellAddr.dnaId.b64]!;
    this._lastTimeQueried = Date.now();
    this._networkMetricsLogs.add([this._lastTimeQueried, dnaResp]);
    /** */
    return dnaResp;
  }


  /** */
  dumpNetworkMetricsLogs(n?: number) {
    console.log(`dumpNetworkMetricsLogs()`, this.cellAddr);
    if (!this.cellAddr) {
      throw Promise.reject("dumpNetworkMetricsLogs() aborted. cellAddr not specified.");
    }
    const nn = n? n : this._networkMetricsLogs.getBufferLength();
    let logs = this._networkMetricsLogs.getLastN(nn).map(([ts, metrics]) => {
      if (metrics.local_agents.length == 0) {
        throw Error("No local agents found in NetworkMetrics");
      }
      if (metrics.local_agents.length == 0) {
        console.warn("dumpNetworkMetricsLogs() More than one local_agent found");
      }
      const local_agent = metrics.local_agents[0]!;
      return {
        //ts,
        ts: prettyDate(new Date(ts)),
        current_arc: arc_size(local_agent.storage_arc),
        target_arc: arc_size(local_agent.target_arc),
        peers: Object.keys(metrics.gossip_state_summary.peer_meta).length,
        //total_peers: Object.keys(metrics.gossip_state_summary.peer_meta).length,
        rounds: metrics.gossip_state_summary.accepted_rounds.length,
        pending_requests: count_pending_requests(metrics.fetch_state_summary),
      }
    })
    console.table(logs);
  }
}


/** */
function count_pending_requests(fetchSummary: FetchStateSummary): number {
  let total = 0;
  for (const peerUrls of Object.values(fetchSummary.pending_requests)) {
    total += peerUrls.length;
  }
  return total;
}


/** */
function arc_size(arc: DhtArc): number {
  if (arc.type == "empty") {
    return 0;
  }
  return arc.value[1] - arc.value[0];
}
