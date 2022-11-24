import {CapSecret, CellId, InstalledCell, RoleId} from "@holochain/client";
import {CellProxy} from "./CellProxy";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {Empty, ICellDef, ZomeSpecific, ZomeSpecificMixin} from "./CellDef";


//export type IZomeProxy = ICellDef & ZomeSpecific

/**
 * ABC for representing the zome function bindings of a Zome.
 * It holds the zomeName and reference to a CellProxy.
 */
export abstract class ZomeProxy extends ZomeSpecific implements ICellDef {

  constructor(protected _cellProxy: CellProxy) {
    super();
    // console.log("ZomeProxy.ctor() ZomeProxy.zomeName", this.constructor.name, ZomeProxy.zomeName)
    // const ctor: any = this.constructor
    console.log("ZomeProxy.ctor() zomeName", this.getZomeName())
  }

  //private _entryDefs?: [string, boolean][];

  //get zomeName(): string {return (this.constructor as any).zomeName}

  /** CellDef interface */
  get cellDef(): InstalledCell { return this._cellProxy.cellDef }
  get roleId(): RoleId { return this._cellProxy.roleId }
  get cellId(): CellId { return this._cellProxy.cellId }
  get dnaHash(): EntryHashB64 { return this._cellProxy.dnaHash}
  get agentPubKey(): AgentPubKeyB64 { return this._cellProxy.agentPubKey }

  /** Helper for calling a zome function on its zome */
  protected async call(fn_name: string, payload: any, cap_secret: CapSecret | null, timeout?: number): Promise<any> {
    console.log("ZomeProxy.call", this.getZomeName())
    return this._cellProxy.callZome(this.getZomeName(), fn_name, payload, cap_secret, timeout);
  }


  // /** */
  // async getEntryDefs(): Promise<[string, boolean][]> {
  //   //if (this._entryDefs) return this._entryDefs;
  //   this._entryDefs = await this.callEntryDefs();
  //   return  this._entryDefs;
  // }

}
