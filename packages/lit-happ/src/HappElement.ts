import {LitElement} from "lit";
import { state } from "lit/decorators.js";
import {
  BaseRoleName,
  AppProxy,
  ConductorAppProxy,
} from "@ddd-qc/cell-proxy";
import {HappViewModel} from "./HappViewModel";
import {CellDef, HvmDef} from "./definitions";
import {
  AppWebsocket,
  ClonedCell,
  InstalledAppId,
} from "@holochain/client";
import {DnaViewModel} from "./DnaViewModel";
//import {CellId} from "@holochain/client/lib/types";
// @ts-ignore
import * as net from "net";
import {NetworkCaller} from "./NetworkCaller";


/**
 *
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
  override shouldUpdate() {
    return !!this.hvm;
  }

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
    this.hvm = await HappViewModel.new(this, this.appProxy, hvmDef, true);
    this.networkCaller = new NetworkCaller(this.appProxy);
    /** FIXME: wait for genesis to finish first? */
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
  async createClone(baseRoleName: BaseRoleName, cellDef?: CellDef): Promise<[ClonedCell, DnaViewModel]> {
    return this.hvm.cloneDvm(baseRoleName, cellDef);
  }

}
