import {LitElement} from "lit";
import { state } from "lit/decorators.js";
import {
    AppProxy,
    ConductorAppProxy,
    flattenCells,
    CellIdStr, AgentIdMap, DnaId, CellAddress, HcConnectionOptions,
} from "@ddd-qc/cell-proxy";
import {HappViewModel} from "./HappViewModel";
import {HvmDef} from "./definitions";
import {
  InstalledAppId, NetworkMetrics,
  Timestamp
} from "@holochain/client";
// @ts-ignore
import * as net from "net";
import {NetworkCaller} from "./NetworkCaller";


/**
 * Base class for HappMultiElements, which are LitElements that wrap multiple HappViewModel,
 * i.e. the main WebComponent of a web-app using multiple Holochain apps.
 */
export class HappMultiElement extends LitElement {

  /** Must be defined by subclass */
  static HVM_DEF: HvmDef;

  /** Set during init triggered at ctor */
  @state() hvms: [AppProxy, HappViewModel][] = []
  get count(): number {return this.hvms.length}

  /** Continually calls networkInfo for a specific cell with appProxy */
  networkCaller?: NetworkCaller;


  @state() _constructed = false;

  /** Ctor */
  protected constructor(
    appConnections: [HcConnectionOptions, string | undefined, InstalledAppId | undefined][],
    public readonly isMainView: boolean,
    ) {
    super();
    this.constructHvms(appConnections)
      .then(() => {
          console.debug("[lit-happ] HappMultiElement: Local Perspective initialized.");
          this._constructed = true;
          console.debug("[lit-happ] HappMultiElement: Initializing Perspective from Network")
          this.initializePerspectiveFromNetwork()
              .then(() => console.debug("[lit-happ] HappMultiElement: Network Perspective initialized."))
      })
  }

  /** */
  protected async constructHvms(appConnections: [HcConnectionOptions, happSha256: string | undefined, InstalledAppId | undefined][]): Promise<void> {
    const hvmDef = (this.constructor as typeof HappMultiElement).HVM_DEF;
    if (!hvmDef) {
      throw Error("HVM_DEF static field undefined in HappMultiElement subclass " + this.constructor.name);
    }
    for (const [options, happSha256, appId] of appConnections) {
      const appProxy = await ConductorAppProxy.new(hvmDef.id, options, happSha256);
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
    console.debug("[lit-happ] HappMultiElement constructed. Initializing Local Perspective...")
    await this.initializePerspectiveFromLocal();
  }

  /** */
  async initializePerspectiveFromLocal(): Promise<void> {
      for (const [_proxy, hvm] of this.hvms) {
          await hvm.initializePerspectiveFromLocal();
      }
      await this.perspectiveInitializedFromLocal();
  }

  async initializePerspectiveFromNetwork(): Promise<void> {
    // for (const [_proxy, hvm] of this.hvms) {
    //   await hvm.initializePerspectiveFromNetwork(); // FIXME: Call Network once Holochain GetStrategy:Network issue is fixed.
    // }
    await this.perspectiveInitializedFromNetwork();
  }

    /** -- Lit lifecycle hooks -- */

    /** */
    override shouldUpdate() {
        return this._constructed && this.hvms.length > 0;
    }


    /** -- Hooks for subclasses to override -- */

    /** */
    async hvmsConstructed(): Promise<void> {}
    /** */
    async perspectiveInitializedFromLocal(): Promise<void> {}
    /** */
    async perspectiveInitializedFromNetwork(): Promise<void> {}


  /** -- Methods -- */

  /** */
  async networkInfoAll(baseRoleName?: string): Promise<Record<CellIdStr, [Timestamp, NetworkMetrics]>> {
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
    const allNetInfos: Record<CellIdStr, [Timestamp, NetworkMetrics]> = {};
    for (const [agent, dnaIds] of dnaPerAgentMap.entries()) {
      for (const dna of dnaIds) {
        const response = await appProxy.dumpNetworkMetrics({dna_hash: dna.hash, include_dht_summary: true});
        if (!response || !response[dna.b64]) {
          throw Promise.reject("No network metrics response for dna");
        }
        const idStr = new CellAddress(dna, agent).str;
        allNetInfos[idStr] = [Date.now(), response[dna.b64]!];
      }
    }
    /* Done */
    return allNetInfos;
  }

}
