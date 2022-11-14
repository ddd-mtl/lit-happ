import {DnaClient} from "./DnaClient";

/** A ZomeBridge is an object that has a zomeName and private DnaClient */
export abstract class ZomeBridge {
  abstract zomeName: string;

  constructor(protected _dnaClient: DnaClient) {}

  /** */
  protected async call(fn_name: string, payload: any, timeout?: number): Promise<any> {
    return this._dnaClient.callZome(this.zomeName, fn_name, payload, timeout);
  }


  /** Returns array of zome's AppEntryDefNames and visibility */
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
