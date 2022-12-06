import {CapSecret, CellId, InstalledCell, ZomeName} from "@holochain/client";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {ZomeSpecific} from "./mixins";
import {CellProxy} from "./CellProxy";
import {IInstalledCell, RoleInstanceId} from "./types";


export type ZomeProxyConstructor = {new(cellProxy: CellProxy, zomeName?: ZomeName): ZomeProxy} & typeof ZomeSpecific;


/**
 * ABC for representing the zome function bindings of a Zome.
 * It holds the zomeName and reference to a CellProxy.
 */
export abstract class ZomeProxy extends ZomeSpecific implements IInstalledCell {

  /** Ctor */
  constructor(protected _cellProxy: CellProxy, zomeName?: ZomeName) {
    super();
    if (zomeName) {this.zomeName = zomeName;}
      else {
        if (!this.getDefaultZomeName()) {
          throw Error("zomeName not defined in ZomeProxy subclass " + this.constructor.name);
        }
      }
  }

  /** InstalledCell interface */
  get installedCell(): InstalledCell { return this._cellProxy.installedCell }
  get roleInstanceId(): RoleInstanceId { return this._cellProxy.roleInstanceId }
  get cellId(): CellId { return this._cellProxy.cellId }
  get dnaHash(): EntryHashB64 { return this._cellProxy.dnaHash}
  get agentPubKey(): AgentPubKeyB64 { return this._cellProxy.agentPubKey }

  /** Helper for calling a zome function on its zome */
  protected async call(fn_name: string, payload: any, maybeSecret?: CapSecret, timeout?: number): Promise<any> {
    //console.log("ZomeProxy.call", this.zomeName)
    const cap_secret = maybeSecret? maybeSecret : null;
    return this._cellProxy.callZome(this.zomeName, fn_name, payload, cap_secret, timeout);
  }

  /** Helper for calling a zome function on its zome */
  protected async callBlocking(fn_name: string, payload: any, maybeSecret?: CapSecret, timeout?: number): Promise<any> {
    //console.log("ZomeProxy.call", this.zomeName)
    const cap_secret = maybeSecret? maybeSecret : null;
    return this._cellProxy.callZomeBlocking(this.zomeName, fn_name, payload, cap_secret, timeout);
  }

}
