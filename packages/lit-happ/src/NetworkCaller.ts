import {AgentId, AppProxy, CellAddress, prettyDate, RingBuffer} from "@ddd-qc/cell-proxy";
import {
    DhtArc,
    DumpNetworkMetricsRequest,
    FetchStateSummary,
    hashFrom32AndType, HoloHashType,
    NetworkMetrics,
    Timestamp
} from "@holochain/client";
import {TransportStats} from "@holochain/client/lib/api/admin/types";


export type NetworkInfoResponse = {
  error: any,
  metrics: NetworkMetrics | undefined,
  stats: TransportStats | undefined,
};

export type NetworkInfoCb = (r: NetworkInfoResponse) => void;


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
  private _isCallRunning: boolean = false;

  private _callbacks: NetworkInfoCb[] = [];

  /** peer pub key to AgentId */
  private _transportToAgentMap: Map<string, AgentId> = new Map();


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
      return this._intervalId !== undefined;
  }

  /** Calling twice will stop it */
  private _callTimeout: number = 30 * 1000;
  startCallLoop(interval: number) {
    //console.debug(`startCallLoop(${interval})`);
    if (this.isLooping()) {
      this.stopCallLoop();
    }
    if (interval <= 1000) {
        throw Error(`Loop interval is too short: ${interval}`);
    }
    this._callTimeout = interval - 100;
    this._intervalId = setInterval(async () => {
        // skip if previous call not done
        if (this._isCallRunning) {
            return;
        }
      this._isCallRunning = true;
      try {
        const metrics = await this.callNetworkMetrics();
        const stats = await this.callNetworkStats();
        this.callRegisteredCallbacks({metrics, stats, error: undefined});
      } catch (e) {
        console.error("Error when calling Network Metrics & Stats.", e);
        this.callRegisteredCallbacks({error: e, metrics: undefined, stats: undefined});
      } finally {
          this._isCallRunning = false;
      }
    }, interval);
  }


  /** */
  private callRegisteredCallbacks(resp: NetworkInfoResponse) {
      for (const cb of this._callbacks) {
          try {
              cb(resp);
          } catch (e) {
              console.error("Error in NetworkCaller callback", e);
          }
      }
  }


  /** */
  addCallback(callback: NetworkInfoCb) {
    this._callbacks.push(callback);
  }

  /** */
  clearAllCallbacks() {
    this._callbacks = [];
  }

  /** */
  stopCallLoop() {
    console.log("NetworkCaller.stopCallLoop()");
    clearInterval(this._intervalId);
    this._intervalId = undefined;
    this._isCallRunning = false;
  }


  /** */
  clear() {
    this._networkMetricsLogs.clear();
    this._networkStatsLogs.clear();
  }


    async peerKeyToAgentId(transportKey: string): Promise<AgentId | undefined> {
        const maybe = this._transportToAgentMap.get(transportKey);
        if (maybe) {
            return maybe;
        }
        await this.updateTransportToAgentMap();
        return this._transportToAgentMap.get(transportKey);
    }


    /** debug */
    dumpTransportToAgentMap() {
        this.updateTransportToAgentMap().then(() => console.table(this._transportToAgentMap));
    }

    /**
     * Build a mapping from transport pub_key to AgentPubKey by fetching agentInfo.
     * AgentInfo returns both the kitsune agent ID and the peer URL, allowing us to
     * map the transport key (from URL) to the actual AgentPubKey.
     */
    async updateTransportToAgentMap() {
        if (!this.cellAddr) {
            throw Promise.reject("buildTransportToAgentMap() aborted. cellAddr not specified.");
        }

        // Fetch agentInfo for these DNAs
        const agentInfoResponse = await this.appProxy.agentInfo({ dna_hashes: [this.cellAddr.dnaId.hash] });

        for (const agentInfoItem of agentInfoResponse) {
            try {
                // Parse the structure: { agentInfo: "{...json...}", signature: "..." }
                const parsed =
                    typeof agentInfoItem === 'string' ? JSON.parse(agentInfoItem) : agentInfoItem;
                const agentInfoData =
                    typeof parsed.agentInfo === 'string' ? JSON.parse(parsed.agentInfo) : parsed.agentInfo;
                const partialAgentId = agentInfoData.agent;
                const peerUrl = agentInfoData.url;
                if (!partialAgentId || !peerUrl) {
                    continue;
                }
                // Extract transport key from the peer URL
                const transportKey = extractTransportKeyFromUrl(peerUrl);
                if (!transportKey) {
                    continue;
                }
                // Convert partial agent ID to full AgentPubKey
                const bytes = decodeUrlSafeBase64(partialAgentId);
                // Convert the 32-byte core to a full agent pub key (adds type prefix and DHT location)
                const fullAgentKey = hashFrom32AndType(bytes, HoloHashType.Agent);
                // Update Map
                this._transportToAgentMap.set(transportKey, new AgentId(fullAgentKey));

            } catch (e) {
                // Skip invalid entries
            }
        }
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
    const response = await this.appProxy.dumpNetworkMetrics(request, this._callTimeout);
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
        const response = await this.appProxy.dumpNetworkStats(this._callTimeout);
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


/**
 * Extract the transport pub_key from a peer URL.
 * Peer URLs typically have format: wss://host/tx5-ws/sig/<transport_pub_key>
 * The transport pub_key is the last path segment.
 */
function extractTransportKeyFromUrl(peerUrl: string): string | null {
    try {
        const urlObj = new URL(peerUrl);
        const pathParts = urlObj.pathname.split('/').filter((p) => p.length > 0);
        // The transport key is the last segment after /tx5-ws/sig/ or similar
        if (pathParts.length > 0) {
            const lastPart = pathParts[pathParts.length - 1]!;
            // Transport keys are typically 40+ characters in URL-safe base64
            if (lastPart.length >= 40) {
                return lastPart;
            }
        }
    } catch {
        // If URL parsing fails, try direct string splitting
        const parts = peerUrl.split('/');
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.length >= 40) {
            return lastPart;
        }
    }
    return null;
}

/**
 * Decode URL-safe base64 string to Uint8Array.
 * URL-safe base64 uses - and _ instead of + and /.
 */
function decodeUrlSafeBase64(urlSafeBase64: string): Uint8Array {
    // Convert URL-safe base64 to standard base64
    let standardBase64 = urlSafeBase64.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if necessary
    while (standardBase64.length % 4 !== 0) {
        standardBase64 += '=';
    }
    // Decode base64 to bytes
    const binaryString = atob(standardBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}