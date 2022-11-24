import {CapSecret, CellId, InstalledCell, RoleId} from "@holochain/client";
import {CellProxy} from "./CellProxy";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {ICellDef, ZomeSpecific} from "./CellDef";


/**
 * ABC for representing the zome function bindings of a Zome.
 * It holds the zomeName and reference to a CellProxy.
 */
export abstract class ZomeProxy extends ZomeSpecific implements ICellDef {

  constructor(protected _cellProxy: CellProxy) {
    super();
  }

  /** CellDef interface */
  get cellDef(): InstalledCell { return this._cellProxy.cellDef }
  get roleId(): RoleId { return this._cellProxy.roleId }
  get cellId(): CellId { return this._cellProxy.cellId }
  get dnaHash(): EntryHashB64 { return this._cellProxy.dnaHash}
  get agentPubKey(): AgentPubKeyB64 { return this._cellProxy.agentPubKey }

  /** Helper for calling a zome function on its zome */
  protected async call(fn_name: string, payload: any, cap_secret: CapSecret | null, timeout?: number): Promise<any> {
    console.log("ZomeProxy.call", this.zomeName)
    return this._cellProxy.callZome(this.zomeName, fn_name, payload, cap_secret, timeout);
  }

}
