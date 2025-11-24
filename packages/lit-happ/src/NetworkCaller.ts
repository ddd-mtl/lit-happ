import {AppProxy, CellAddress, prettyDate, RingBuffer} from "@ddd-qc/cell-proxy";
import {DhtArc, DumpNetworkMetricsRequest, FetchStateSummary, NetworkMetrics, Timestamp} from "@holochain/client";
import {TransportStats} from "@holochain/client/lib/api/admin/types";

type NetworkInfoCb = (info:NetworkMetrics, m: TransportStats) => void;


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
  private _networkStatsLogs: RingBuffer<[Timestamp, TransportStats]> = new RingBuffer(50);


  private _intervalId: any | undefined = undefined;

  private _callbacks: NetworkInfoCb[] = [];

  /** -- Getters & Setters -- */

  setCellAddr(cellAddr: CellAddress) { this.cellAddr = cellAddr};

  setCapacity(n: number) {
    this._networkMetricsLogs.resize(n);
    this._networkStatsLogs.resize(n);
  }

  get networkMetricsLogs(): [Timestamp, NetworkMetrics][] {return this._networkMetricsLogs.toArray();}

  get networkStatsLogs(): [Timestamp, TransportStats][] {return this._networkStatsLogs.toArray();}


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
      const res2 = await this.callNetworkStats();
      for (const callback of this._callbacks) {
        callback(res, res2);
      }
    }, interval);
  }


  /** */
  addCallback(callback: (n: NetworkMetrics, m: TransportStats) => void) {
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
    this._networkStatsLogs.clear();
  }


  /** */
  async callNetworkMetrics(): Promise<NetworkMetrics> {
    if (!this.cellAddr) {
      throw Promise.reject("callNetworkMetrics() aborted. cellAddr not specified.");
    }
    /* Call networkInfo */
    const request: DumpNetworkMetricsRequest = {
        dna_hash: this.cellAddr.dnaId.hash,
        include_dht_summary: true, // ???
    };
    const response = await this.appProxy.dumpNetworkMetrics(request);
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
      throw Error("dumpNetworkMetricsLogs() aborted. cellAddr not specified.");
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

    /** */
    async callNetworkStats(): Promise<TransportStats> {
        const response = await this.appProxy.dumpNetworkStats();
        if (!response) {
            throw Promise.reject("No network stats response for dna");
        }
        /* Store */
        this._networkStatsLogs.add([this._lastTimeQueried, response]);
        /** */
        return response;
    }


    /** */
    dumpNetworkStatsLogs(n?: number) {
        console.log(`dumpNetworkStatsLogs()`);
        const nn = n ? n : this._networkStatsLogs.getBufferLength();
        this._networkStatsLogs.getLastN(nn).map(([ts, stats]) => {
            console.log(`[${prettyDate(new Date(ts))}] Backend: ${stats.backend} ; Peers: ${stats.peer_urls.length}`);
            const logs = stats.connections.map((connection) => {
                return connection;
            });
            console.table(logs);
        });
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
  if (arc == null) {
    return 0;
  }
  return arc[1] - arc[0];
}
