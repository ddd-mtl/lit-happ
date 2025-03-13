import {AppProxy, CellAddress, prettyDate, RingBuffer} from "@ddd-qc/cell-proxy";
import {NetworkInfo, NetworkInfoRequest, Timestamp} from "@holochain/client";

/**
 * Class handling network info calling and result storing
 */
export class NetworkCaller {

  /** */
  constructor(private appProxy: AppProxy, private cellAddr?: CellAddress) {
    // N/A
  }


  private _lastTimeQueried: Timestamp = 0;
  private _networkInfoLogs: RingBuffer<[Timestamp, NetworkInfo]> = new RingBuffer(50);

  private _intervalId: any | undefined = undefined;

  /** -- Getters & Setters -- */

  setCellAddr(cellAddr: CellAddress) { this.cellAddr = cellAddr};

  setCapacity(n: number) {
    this._networkInfoLogs.resize(n);
  }

  get networkInfoLogs(): [Timestamp, NetworkInfo][] {return this._networkInfoLogs.toArray();}


  /** -- Methods -- */

  isLooping(): boolean {
    console.log("bruh", this._intervalId, this._intervalId === undefined);
    const isUnd = this._intervalId === undefined
    return !isUnd;
  }

  /** */
  startCallLoop(interval: number, callback?: (n:NetworkInfo) => void) {
    // FIXME
    if (this.isLooping()) {
      this.stopCallLoop();
    }
    this._intervalId = setInterval(async () => {
      //console.log("Requesting network info...");
      const res = await this.callNetworkInfo();
      if (callback) {
        callback(res);
      }
    }, interval);
  }


  /** */
  stopCallLoop() {
    clearInterval(this._intervalId);
    this._intervalId = undefined;
  }


  /** */
  clear() {
    this._networkInfoLogs.clear();
  }


  /** */
  async callNetworkInfo(): Promise<NetworkInfo> {
    if (!this.cellAddr) {
      throw Promise.reject("callNetworkInfo() aborted. cellAddr not specified.");
    }
    /* Call networkInfo */
    const response = await this.appProxy.networkInfo({
      dnas: [this.cellAddr.dnaId.hash],
      last_time_queried: this._lastTimeQueried,
    } as NetworkInfoRequest);
    if (response.length == 0) {
      throw Promise.reject("No network info response");
    }
    /* Store */
    this._lastTimeQueried = Date.now();
    this._networkInfoLogs.add([this._lastTimeQueried, response[0]!]);
    /** */
    return response[0]!;
  }


  /** */
  dumpNetworkInfoLogs(n?: number) {
    console.log(`dumpNetworkInfoLogs()`, this.cellAddr);
    if (!this.cellAddr) {
      throw Promise.reject("dumpNetworkInfoLogs() aborted. cellAddr not specified.");
    }
    const nn = n? n : this._networkInfoLogs.getBufferLength();
    let logs = this._networkInfoLogs.getLastN(nn).map(([ts, info]) => {
      return {
        //ts,
        ts: prettyDate(new Date(ts)),
        arc: info.arc_size,
        peers: info.current_number_of_peers,
        total_peers: info.total_network_peers,
        rounds: info.completed_rounds_since_last_time_queried,
        bytes: info.bytes_since_last_time_queried,
        fetch_bytes: info.fetch_pool_info.op_bytes_to_fetch,
        fetch_ops: info.fetch_pool_info.num_ops_to_fetch,
        //agent: this.cellAddr!.agentId.short,
      }
    })
    console.table(logs);
  }



  // /** call network Info on all cells of the Happ */
  // async networkInfoAll(baseRoleName?: string): Promise<Record<CellIdStr, [Timestamp, NetworkInfo]>> {
  //   console.debug(`networkInfoAll() "${baseRoleName}"`);
  //   /** Grab cellMap */
  //   const hvmDef = (this.constructor as typeof HappElement).HVM_DEF;
  //   const cellMap = this.appProxy.getAppCells(hvmDef.id);
  //   if (!cellMap) {
  //     return Promise.reject("No cells found at given appId: " + hvmDef.id);
  //   }
  //   /** Get cell Ids */
  //   let cellAddrs: CellAddress[] = [];
  //   if (baseRoleName) {
  //     const cfr = cellMap[baseRoleName];
  //     if (!cfr) {
  //       return Promise.reject("No cells found at given baseRoleName: " + baseRoleName);
  //     }
  //     cellAddrs = flattenCells(cfr);
  //   } else {
  //     for (const cells of Object.values(cellMap)) {
  //       cellAddrs = cellAddrs.concat(flattenCells(cells))
  //     }
  //   }
  //   console.debug(`networkInfoAll() cellIds`, cellAddrs.map(cellId => cellId.str));
  //   /* Sort by agent key */
  //   let dnaPerAgentMap: AgentIdMap<DnaId[]> = new AgentIdMap();
  //   for (const cellAddr of cellAddrs) {
  //     if (!dnaPerAgentMap.get(cellAddr.agentId)) {
  //       dnaPerAgentMap.set(cellAddr.agentId, []);
  //     }
  //     dnaPerAgentMap.get(cellAddr.agentId)!.push(cellAddr.dnaId);
  //   }
  //   console.debug(`networkInfoAll() dnaMap`, dnaPerAgentMap);
  //   /** Call NetworkInfo per AgentId */
  //   const allNetInfos: Record<CellIdStr, [Timestamp, NetworkInfo]> = {};
  //   for (const [agent, dnaIds] of dnaPerAgentMap.entries()) {
  //     const netInfos = await this.appProxy.networkInfo({dnas: dnaIds.map((dna) => dna.hash)});
  //     let i  = 0;
  //     for (const netInfo of netInfos) {
  //       const idStr = new CellAddress(dnaIds[i]!, agent).str;
  //       allNetInfos[idStr] = [Date.now(), netInfo];
  //       i += 1;
  //     }
  //   }
  //   /* Done */
  //   return allNetInfos;
  // }

}
