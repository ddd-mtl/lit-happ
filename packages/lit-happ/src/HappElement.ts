import {LitElement} from "lit";
import { state } from "lit/decorators.js";
import {
  BaseRoleName,
  AppProxy,
  ConductorAppProxy,
  HCL,
  Dictionary,
  flattenCells,
  prettyDate,
  CellIdStr, str2CellId
} from "@ddd-qc/cell-proxy";
import {HappViewModel} from "./HappViewModel";
import {CellDef, HvmDef} from "./definitions";
import {
  AgentPubKeyB64,
  AppWebsocket,
  ClonedCell, decodeHashFromBase64,
  DnaHashB64,
  encodeHashToBase64,
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
  protected constructor(port_or_socket: number | AppWebsocket, appId?: InstalledAppId) {
    super();
    /* await */ this.constructHvm(port_or_socket, appId);
  }

  /** */
  async hvmConstructed(): Promise<void> {}
  /** */
  async perspectiveInitializedOffline(): Promise<void> {}
  /** */
  async perspectiveInitializedOnline(): Promise<void> {}


  /** */
  protected async constructHvm(port_or_socket: number | AppWebsocket, appId?: InstalledAppId): Promise<void> {
    this.appProxy = await ConductorAppProxy.new(port_or_socket);
    const hvmDef = (this.constructor as typeof HappElement).HVM_DEF;
    if (!hvmDef) {
      throw Error("HVM_DEF static field undefined in HappElement subclass " + this.constructor.name);
    }
    /** Override appId */
    if (appId) {
      hvmDef.id = appId;
    }
    this.hvm = await HappViewModel.new(this, this.appProxy, hvmDef);
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
    const netInfoMap = this.appProxy.networkInfo(dvm.cell.agentPubKey, [dvm.cell.dnaHash]);
    return netInfoMap[dvm.cell.dnaHash][1];
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
    let dnaMap: Record<AgentPubKeyB64, DnaHashB64[]> = {}
    for (const cellId of cellIds) {
      const key = encodeHashToBase64(cellId[1]);
      if (!dnaMap[key]) {
        dnaMap[key] = [];
      }
      dnaMap[key].push(encodeHashToBase64(cellId[0]))
    }
    console.log(`networkInfoAll() dnaMap`, dnaMap);
    /** Call NetworkInfo per AgentPubKey */
    const allNetInfos = {};
    for (const [agent, dnaHashes] of Object.entries(dnaMap)) {
      const netInfos = await this.appProxy.networkInfo(agent, dnaHashes);
      for (const [dnaHash, infoPair] of Object.entries(netInfos)) {
        const idStr = CellIdStr(decodeHashFromBase64(dnaHash), decodeHashFromBase64(agent));
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
      const dnaHash = encodeHashToBase64(cellId[0]);
      const hcl = this.appProxy.getLocations(cellId);
      const cellName = this.appProxy.getCellName(hcl[0]);
      const dnaName =  dnaHash.slice(-6);
      const agentName = encodeHashToBase64(cellId[1]).slice(-6);
      return {
            ts,
            name: cellName,
            dna: dnaName,
            arc: info.arc_size,
            peers: info.current_number_of_peers,
            total_peers: info.total_network_peers,
            rounds: info.completed_rounds_since_last_time_queried,
            bytes: info.bytes_since_last_time_queried,
            fetch_bytes: info.fetch_pool_info.op_bytes_to_fetch,
            fetch_ops: info.fetch_pool_info.num_ops_to_fetch,
            agent: agentName,
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
      const dnaHash = encodeHashToBase64(cellId[0]);
      const hcl = this.appProxy.getLocations(cellId);
      const cellName = this.appProxy.getCellName(hcl[0]);
      const dnaName =  dnaHash.slice(-6);
      const agentName = encodeHashToBase64(cellId[1]).slice(-6);
      console.log(`NetworfInfo logs of cell "${cellName}" | [${agentName}, ${dnaName}]`);
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
