import { CapSecret } from "@holochain/client";
import {CellProxy} from "./CellProxy";


/**
 * ABC for representing the zome function bindings of a Zome.
 * It holds the zomeName and reference to a CellProxy.
 */
export abstract class ZomeProxy {

  constructor(protected _cellProxy: CellProxy) {}

  //private _entryDefs?: [string, boolean][];


  abstract get zomeName(): string;

  /** Helper for calling a zome function on its zome */
  protected async call(fn_name: string, payload: any, cap_secret: CapSecret | null, timeout?: number): Promise<any> {
    return this._cellProxy.callZome(this.zomeName, fn_name, payload, cap_secret, timeout);
  }


  // /** */
  // async getEntryDefs(): Promise<[string, boolean][]> {
  //   //if (this._entryDefs) return this._entryDefs;
  //   this._entryDefs = await this.callEntryDefs();
  //   return  this._entryDefs;
  // }

}
