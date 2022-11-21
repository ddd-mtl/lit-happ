import { CapSecret } from "@holochain/client";
import {CellProxy} from "./CellProxy";


/**
 * ABC for representing the zome function bindings of a Zome.
 * It holds the zomeName and reference to a DnaProxy.
 */
export abstract class ZomeProxy {

  constructor(protected _dnaProxy: CellProxy) {}

  private _entryDefs?: [string, boolean][];


  abstract get zomeName(): string;

  /** Helper for calling a zome function on its zome */
  protected async call(fn_name: string, payload: any, cap_secret: CapSecret | null, timeout?: number): Promise<any> {
    return this._dnaProxy.callZome(this.zomeName, fn_name, payload, cap_secret, timeout);
  }


  /** */
  async getEntryDefs(): Promise<[string, boolean][]> {
    //if (this._entryDefs) return this._entryDefs;
    this._entryDefs = await this.callEntryDefs();
    return  this._entryDefs;
  }


  /**
   * Calls the `entry_defs()` zome function and
   * returns an array of all the zome's AppEntryDefNames and visibility
   */
   private async callEntryDefs(): Promise<[string, boolean][]> {
    try {
      const entryDefs = await this.call("entry_defs", null, null, 2 * 1000);
      //console.debug("getEntryDefs() for " + this.zomeName + " result:")
      //console.log({entryDefs})
      let result: [string, boolean][] = []
      for (const def of entryDefs.Defs) {
        const name = def.id.App;
        result.push([name, def.visibility.hasOwnProperty('Public') ])
      }
      //console.log({result})
      return result;
    } catch (e) {
      console.error("Calling getEntryDefs() on " + this.zomeName + " failed: ")
      console.error({e})
    }
    return [];
  }

}
