import {LitElement} from "lit";
import { state } from "lit/decorators.js";
import {
  BaseRoleName,
  AppProxy,
  ConductorAppProxy,
  HCL,
  flattenCells,
  CellIdStr, str2CellId,
  AgentIdMap,
  DnaId, decomposeCellId
} from "@ddd-qc/cell-proxy";
import {HappViewModel} from "./HappViewModel";
import {CellDef, HvmDef} from "./definitions";
import {
  AppWebsocket,
  ClonedCell,
  InstalledAppId,
  NetworkInfo, Timestamp
} from "@holochain/client";
import {DnaViewModel} from "./DnaViewModel";
import {CellId} from "@holochain/client/lib/types";
import * as net from "net";


/**
 *
 */
export class HappElement extends LitElement {

  /** Must be defined by subclass */
  static HVM_DEF: HvmDef;

  /** Set during init triggered at ctor */
  appProxy!: AppProxy;
  @state() hvm!: HappViewModel;


  /** Ctor */
  protected constructor(port_or_socket: number | AppWebsocket, appId?: InstalledAppId, adminUrl?: URL, defaultTimeout?: number) {
    super();
    /* await */ this.constructHvm(port_or_socket, appId, adminUrl, defaultTimeout);
  }

  /** */
  async hvmConstructed(): Promise<void> {}
  /** */
  async perspectiveInitializedOffline(): Promise<void> {}
  /** */
  async perspectiveInitializedOnline(): Promise<void> {}


  /** */
  protected async constructHvm(port_or_socket: number | AppWebsocket, appId?: InstalledAppId, adminUrl?: URL, defaultTimeout?: number): Promise<void> {
    const hvmDef = (this.constructor as typeof HappElement).HVM_DEF;
    if (!hvmDef) {
      throw Error("HVM_DEF static field undefined in HappElement subclass " + this.constructor.name);
    }
    /** Override appId */
    if (appId) {
      hvmDef.id = appId;
    }
    this.appProxy = await ConductorAppProxy.new(port_or_socket, hvmDef.id, adminUrl, defaultTimeout);
    this.hvm = await HappViewModel.new(this, this.appProxy, hvmDef);
    await this.hvm.authorizeAllZomeCalls(this.appProxy.adminWs);
    await this.hvmConstructed();
    await this.initializePerspective();
  }


  /** */
  async initializePerspective(): Promise<void> {
    await this.hvm.initializePerspectiveOffline();
    await this.perspectiveInitializedOffline();
    // TODO move this to a later stage
    await this.hvm.initializePerspectiveOnline();
    await this.perspectiveInitializedOnline();
  }


  /** */
  async networkInfoCell(hcl: HCL): Promise<NetworkInfo> {
    const dvm = this.hvm.getDvm(hcl);
    if (!dvm) {
      return Promise.reject("No DNA found at given HCL: " + hcl.toString());
    }
    const netInfoMap = this.appProxy.networkInfo({dnas: [dvm.cell.dnaId.hash]});
    return netInfoMap[dvm.cell.dnaId.b64][1];
  }


  /** */
  async networkInfoAll(baseRoleName?: string): Promise<Record<CellIdStr, [Timestamp, NetworkInfo]>> {
    console.log(`networkInfoAll() "${baseRoleName}"`);
    /** Grab cellMap */
    const hvmDef = (this.constructor as typeof HappElement).HVM_DEF;
    const cellMap = this.appProxy.getAppCells(hvmDef.id);
    if (!cellMap) {
      return Promise.reject("No cells found at given appId: " + hvmDef.id);
    }
    /** Get cell Ids */
    let cellIds: CellId[] = [];
    if (baseRoleName) {
      const cfr = cellMap[baseRoleName];
      if (!cfr) {
        return Promise.reject("No cells found at given baseRoleName: " + baseRoleName);
      }
      cellIds = flattenCells(cfr);
    } else {
      for (const cells of Object.values(cellMap)) {
        cellIds = cellIds.concat(flattenCells(cells))
      }
    }
    console.log(`networkInfoAll() cellIds`, cellIds);
    /* Sort by agent key */
    let dnaMap: AgentIdMap<DnaId[]> = new AgentIdMap();
    for (const cellId of cellIds) {
      const [dnaId, agentId] = decomposeCellId(cellId);
      if (!dnaMap.get(agentId)) {
        dnaMap.set(agentId, []);
      }
      dnaMap.get(agentId).push(dnaId);
      //dnaMap.set(agentId, dnaMap.get(agentId).push(dnaId));
    }
    console.log(`networkInfoAll() dnaMap`, dnaMap);
    /** Call NetworkInfo per AgentPubKey */
    const allNetInfos = {};
    for (const [agentId, dnaIds] of dnaMap.entries()) {
      const netInfos = await this.appProxy.networkInfo({dnas: dnaIds.map((dnaId) => dnaId.hash)});
      for (const [dnaHash, infoPair] of Object.entries(netInfos)) {
        const idStr = CellIdStr(new DnaId(dnaHash), agentId);
        allNetInfos[idStr] = infoPair;
      }
    }
    /* Done */
    return allNetInfos;
  }


  /** */
  dumpLastestNetworkInfo(baseRoleName?: string) {
    console.log(`dumpLastestNetworkInfo() "${baseRoleName}"`);
    /** Grab cellMap */
    const hvmDef = (this.constructor as typeof HappElement).HVM_DEF;
    const cellMap = this.appProxy.getAppCells(hvmDef.id);
    if (!cellMap) {
      throw Error("No cells found at given appId: " + hvmDef.id);
    }
    /** Get cell Ids */
    let cellIds: CellId[] = [];
    if (baseRoleName) {
      const cfr = cellMap[baseRoleName];
      if (!cfr) {
        return Promise.reject("No cells found at given baseRoleName: " + baseRoleName);
      }
      cellIds = flattenCells(cfr);
    } else {
      for (const cells of Object.values(cellMap)) {
        cellIds = cellIds.concat(flattenCells(cells))
      }
    }
    let logs = cellIds.map((cellId) => {
      const str = CellIdStr(cellId);
      const logs = this.appProxy.networkInfoLogs[str];
      if (logs.length === 0) {
        return;
      }
      const [ts, info] = logs[logs.length - 1];
      const [dnaId, agentId] = decomposeCellId(cellId);
      //const dnaHash = encodeHashToBase64(cellId[0]);
      const hcl = this.appProxy.getLocations(cellId);
      const cellName = this.appProxy.getCellName(hcl[0]);
      //const dnaName =  dnaHash.slice(-6);
      //const agentName = encodeHashToBase64(cellId[1]).slice(-6);
      return {
            ts,
            name: cellName,
            dna: dnaId.short,
            arc: info.arc_size,
            peers: info.current_number_of_peers,
            total_peers: info.total_network_peers,
            rounds: info.completed_rounds_since_last_time_queried,
            bytes: info.bytes_since_last_time_queried,
            fetch_bytes: info.fetch_pool_info.op_bytes_to_fetch,
            fetch_ops: info.fetch_pool_info.num_ops_to_fetch,
            agent: agentId.short,
          }
    })
    console.table(logs);
  }


  /* */
  dumpNetworkInfoLogs(cellIdStr?: string) {
    console.log(`dumpNetworkInfoLogs() "${cellIdStr}"`);
    let logMap = this.appProxy.networkInfoLogs;
    if (cellIdStr) {
      logMap = {};
      logMap[cellIdStr] = this.appProxy.networkInfoLogs[cellIdStr];
    }
    for (const [cellIdStr, infoPairs] of Object.entries(logMap)) {
      const cellId = str2CellId(cellIdStr);
      const [dnaId, agentId] = decomposeCellId(cellId);
      //const dnaHash = encodeHashToBase64(cellId[0]);
      const hcl = this.appProxy.getLocations(cellId);
      const cellName = this.appProxy.getCellName(hcl[0]);
      //const dnaName =  dnaHash.slice(-6);
      //const agentName = encodeHashToBase64(cellId[1]).slice(-6);
      console.log(`NetworfInfo logs of cell "${cellName}" | [${agentId.short}, ${dnaId.short}]`);
      const logs = infoPairs
        .map(([ts, info]) => {
          return {
            ts,
            arc: info.arc_size,
            peers: info.current_number_of_peers,
            total_peers: info.total_network_peers,
            rounds: info.completed_rounds_since_last_time_queried,
            bytes: info.bytes_since_last_time_queried,
            fetch_bytes: info.fetch_pool_info.op_bytes_to_fetch,
            fetch_ops: info.fetch_pool_info.num_ops_to_fetch,
          }
        });
      console.table(logs);
    }
  }


  /** */
  async createClone(baseRoleName: BaseRoleName, cellDef?: CellDef): Promise<[ClonedCell, DnaViewModel]> {
    return this.hvm.cloneDvm(baseRoleName, cellDef);
  }


  /** */
  shouldUpdate() {
    return !!this.hvm;
  }

}
