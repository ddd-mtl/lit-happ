import {LitElement} from "lit";
import { state } from "lit/decorators.js";
import {BaseRoleName, ConductorAppProxy} from "@ddd-qc/cell-proxy";
import {HappViewModel} from "./HappViewModel";
import {CellDef, HvmDef} from "./definitions";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {AppWebsocket, InstalledAppId} from "@holochain/client";
import {DnaViewModel} from "./DnaViewModel";


/**
 *
 */
export class HappElement extends ScopedElementsMixin(LitElement) {

  /** Must be defined by subclass */
  static HVM_DEF: HvmDef;

  conductorAppProxy!: ConductorAppProxy;
  @state() hvm!: HappViewModel;


  /** Ctor */
  protected constructor(port_or_socket: number | AppWebsocket, appId?: InstalledAppId) {
    super();
    /* await */ this.initHapp(port_or_socket, appId);
  }


  /** */
  async happInitialized(): Promise<void> {}


  /** */
  protected async initHapp(port_or_socket: number | AppWebsocket, appId?: InstalledAppId): Promise<void> {
    this.conductorAppProxy = await ConductorAppProxy.new(port_or_socket);
    const hvmDef = (this.constructor as typeof HappElement).HVM_DEF;
    if (!hvmDef) {
      throw Error("HVM_DEF static field undefined in HappElement subclass " + this.constructor.name);
    }
    /** Override appId */
    if (appId) {
      hvmDef.id = appId;
    }
    this.hvm = await HappViewModel.new(this, this.conductorAppProxy, hvmDef);
    await this.happInitialized();
  }


  /** */
  async createClone(baseRoleName: BaseRoleName, cellDef?: CellDef): Promise<[number, DnaViewModel]> {
    return this.hvm.cloneDvm(baseRoleName, cellDef);
  }




  /** */
  shouldUpdate() {
    return !!this.hvm;
  }

}
