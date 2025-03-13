import {LitElement} from "lit";
import { state } from "lit/decorators.js";
import {
  AppProxy,
  ConductorAppProxy,
  flattenCells,
  CellIdStr, AgentIdMap, DnaId, CellAddress,
} from "@ddd-qc/cell-proxy";
import {HappViewModel} from "./HappViewModel";
import {/*CellDef,*/ HvmDef} from "./definitions";
import {
  AppWebsocket,
  InstalledAppId,
  NetworkInfo, Timestamp
} from "@holochain/client";
// @ts-ignore
import * as net from "net";
import {NetworkCaller} from "./NetworkCaller";


/**
 *
 */
export class HappMultiElement extends LitElement {

  /** Must be defined by subclass */
  static HVM_DEF: HvmDef;

  /** Set during init triggered at ctor */
  @state() hvms: [AppProxy, HappViewModel][] = []

  /** Continually calls networkInfo for a specific cell with appProxy */
  networkCaller?: NetworkCaller;

  get count(): number {return this.hvms.length}

  /** Ctor */
  protected constructor(
    appInfo: [number | AppWebsocket, InstalledAppId | undefined][],
    public readonly isMainView: boolean,
    adminUrl?: URL,
    defaultTimeout?: number,
    ) {
    super();
    /* await */ this.constructHvms(appInfo, adminUrl, defaultTimeout);
  }

  /** */
  async hvmsConstructed(): Promise<void> {}
  /** */
  async perspectiveInitializedOffline(): Promise<void> {}
  /** */
  async perspectiveInitializedOnline(): Promise<void> {}

  /** */
  override shouldUpdate() {
    return this.hvms.length > 0;
  }

  /** */
  protected async constructHvms(appInfo: [number | AppWebsocket, InstalledAppId | undefined][], adminUrl?: URL, defaultTimeout?: number): Promise<void> {
    const hvmDef = (this.constructor as typeof HappMultiElement).HVM_DEF;
    if (!hvmDef) {
      throw Error("HVM_DEF static field undefined in HappMultiElement subclass " + this.constructor.name);
    }
    for (const [port_or_socket, appId] of appInfo) {
      const appProxy = await ConductorAppProxy.new(port_or_socket, hvmDef.id, adminUrl, defaultTimeout);
      if (appId) {
        /** Override appId */
        hvmDef.id = appId;
      }
      const hvm = await HappViewModel.new(this, appProxy, hvmDef, this.isMainView);
      await hvm.authorizeAllZomeCalls(appProxy.adminWs);
      this.hvms.push([appProxy, hvm]);
    }
    this.networkCaller = new NetworkCaller(this.hvms[0]![0]); // use first appProxy
    await this.hvmsConstructed();
    await this.initializePerspective();
  }


  /** */
  async initializePerspective(): Promise<void> {
    for (const [_proxy, hvm] of this.hvms) {
      await hvm.initializePerspectiveOffline();
    }
    await this.perspectiveInitializedOffline();

    // TODO move this to a later stage
    for (const [_proxy, hvm] of this.hvms) {
      await hvm.initializePerspectiveOnline();
    }
    await this.perspectiveInitializedOnline();
  }


  /** */
  async networkInfoAll(baseRoleName?: string): Promise<Record<CellIdStr, [Timestamp, NetworkInfo]>> {
    //console.debug(`networkInfoAll() "${baseRoleName}"`);
    /** Grab cellMap */
    const hvmDef = (this.constructor as typeof HappMultiElement).HVM_DEF;
    const appProxy = this.hvms[0]![0];
    const cellMap = appProxy.getAppCells(hvmDef.id);
    if (!cellMap) {
      return Promise.reject("No cells found at given appId: " + hvmDef.id);
    }
    /** Get cell Ids */
    let cellAddrs: CellAddress[] = [];
    if (baseRoleName) {
      const cfr = cellMap[baseRoleName];
      if (!cfr) {
        return Promise.reject("No cells found at given baseRoleName: " + baseRoleName);
      }
      cellAddrs = flattenCells(cfr);
    } else {
      for (const cells of Object.values(cellMap)) {
        cellAddrs = cellAddrs.concat(flattenCells(cells))
      }
    }
    //console.debug(`networkInfoAll() cellIds`, cellAddrs.map(cellId => cellId.str));
    /* Sort by agent key */
    let dnaPerAgentMap: AgentIdMap<DnaId[]> = new AgentIdMap();
    for (const cellAddr of cellAddrs) {
      if (!dnaPerAgentMap.get(cellAddr.agentId)) {
        dnaPerAgentMap.set(cellAddr.agentId, []);
      }
      dnaPerAgentMap.get(cellAddr.agentId)!.push(cellAddr.dnaId);
    }
    //console.debug(`networkInfoAll() dnaMap`, dnaPerAgentMap);
    /** Call NetworkInfo per AgentId */
    const allNetInfos: Record<CellIdStr, [Timestamp, NetworkInfo]> = {};
    for (const [agent, dnaIds] of dnaPerAgentMap.entries()) {
      const netInfos = await appProxy.networkInfo({dnas: dnaIds.map((dna) => dna.hash)});
      let i  = 0;
      for (const netInfo of netInfos) {
        const idStr = new CellAddress(dnaIds[i]!, agent).str;
        allNetInfos[idStr] = [Date.now(), netInfo];
        i += 1;
      }
    }
    /* Done */
    return allNetInfos;
  }

}
