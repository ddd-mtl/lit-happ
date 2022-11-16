import {DnaClient} from "./DnaClient";

/**
 * ABC for representing the zome function bindings of a Zome.
 * It holds the zomeName and private DnaClient.
 */
export abstract class ZomeBridge {
  abstract zomeName: string;

  constructor(protected _dnaClient: DnaClient) {}


  /** Helper for calling a zome function on its zome */
  protected async call(fn_name: string, payload: any, timeout?: number): Promise<any> {
    return this._dnaClient.callZome(this.zomeName, fn_name, payload, timeout);
  }


  /**
   * Calls the `entry_defs()` zome function and
   * returns an array of all the zome's AppEntryDefNames and visibility
   */
  async getEntryDefs(): Promise<[string, boolean][]> {
    try {
      const entryDefs = await this.call("entry_defs", null, 2 * 1000);
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
