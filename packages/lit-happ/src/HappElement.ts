import {LitElement} from "lit";
import { state } from "lit/decorators.js";
import {
    BaseRoleName,
    AppProxy,
    ConductorAppProxy, HcConnectionOptions,
} from "@ddd-qc/cell-proxy";
import {HappViewModel} from "./HappViewModel";
import {CellDef, HvmDef} from "./definitions";
import {
  ClonedCell,
  InstalledAppId,
} from "@holochain/client";
import {DnaViewModel} from "./DnaViewModel";
// @ts-ignore
import * as net from "net";
import {NetworkCaller} from "./NetworkCaller";


/**
 * Base class for HappElements, which are LitElements that wrap a HappViewModel,
 * i.e. the main WebComponent of a single Holochain app.
 */
export class HappElement extends LitElement {

  /** Must be defined by subclass */
  static HVM_DEF: HvmDef;

  /** Set during init triggered at ctor */
  protected appProxy!: AppProxy;
  @state() hvm!: HappViewModel;

  /** Continually calls networkInfo for a specific cell with appProxy */
  networkCaller?: NetworkCaller;

  /** Ctor */
  protected constructor(options: HcConnectionOptions, happSha256?: string, appId?: InstalledAppId) {
    super();
    this.constructHvm(options, happSha256, appId)
        .then(() => console.debug("HappElement constructed:", this.hvm.appId))
  }

  /** */
  protected async constructHvm(options: HcConnectionOptions, happSha256?: string, appId?: InstalledAppId): Promise<void> {
    const hvmDef = (this.constructor as typeof HappElement).HVM_DEF;
    if (!hvmDef) {
      throw Error("HVM_DEF static field undefined in HappElement subclass " + this.constructor.name);
    }
    /** Override appId */
    if (appId) {
      hvmDef.id = appId;
    }
    this.appProxy = await ConductorAppProxy.new(hvmDef.id, options, happSha256);
    this.hvm = await HappViewModel.new(this, this.appProxy, hvmDef, true);
    this.networkCaller = new NetworkCaller(this.appProxy);
    /** FIXME: wait for genesis to finish first? */
    await this.hvm.authorizeAllZomeCalls(this.appProxy.adminWs);
    await this.hvmConstructed();
    await this.initializePerspectiveFromLocal();
  }

  /** */
  async initializePerspectiveFromLocal(): Promise<void> {
      await this.hvm.initializePerspectiveFromLocal();
      await this.perspectiveInitializedFromLocal();
      console.debug("Finished initializing Happ perspective with Local data. App: " + this.hvm.appId);
  }

  /** */
  async initializePerspectiveFromNetwork(): Promise<void> {
    await this.hvm.initializePerspectiveFromLocal(); // // FIXME: Call Network once Holochain GetStrategy:Network issue is fixed.
    await this.perspectiveInitializedFromNetwork();
  }

    /** -- Lit lifecycle hooks -- */

    /** */
    override shouldUpdate() {
        return !!this.hvm;
    }

    /** After first render, attempt to get data from the network */
    override firstUpdated() {
        console.debug("[lit-happ] HappElement: Initializing Perspective from Network")
        this.initializePerspectiveFromNetwork()
            .then(() => console.debug("Finished initializing HappElement Network Perspective. App: " + this.hvm.appId))
    }

    /** -- Hooks for subclasses to override -- */

    /** */
    async hvmConstructed(): Promise<void> {}
    /** */
    async perspectiveInitializedFromLocal(): Promise<void> {}
    /** */
    async perspectiveInitializedFromNetwork(): Promise<void> {}


    /** -- Methods -- */

    /** */
    async createClone(baseRoleName: BaseRoleName, cellDef?: CellDef): Promise<[ClonedCell, DnaViewModel]> {
        return this.hvm.cloneDvm(baseRoleName, cellDef);
    }
}
