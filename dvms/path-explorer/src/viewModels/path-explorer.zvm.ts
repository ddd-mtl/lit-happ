import {PathExplorerProxy} from "../bindings/path-explorer.proxy";
import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {ZomeName} from "@holochain/client";

/**
 *
 */
export class PathExplorerZvm extends ZomeViewModel {

  static override readonly ZOME_PROXY = PathExplorerProxy;

  get zomeProxy(): PathExplorerProxy {
    return this._zomeProxy as PathExplorerProxy;
  }


  /** -- Perspective -- */

  /* */
  get perspective(): Object {
    return {};
  }


  /** -- Methods -- */


  /** Should probably cache dnaInfo at init and not have this fn be async */
  async getZomeName(zomeIndex: number): Promise<ZomeName> {
    const dnaInfo = await this._zomeProxy.dnaInfo();
    const maybe = dnaInfo.zome_names[zomeIndex];
    if (!maybe) {
      throw Promise.reject("Unknown zomeIndex");
    }
    return maybe;
  }


  /** Should probably cache dnaInfo at init and not have this fn be async */
  async getEntryName(zomeName: ZomeName, entryIndex: number): Promise<string> {
    const entryDefs = await this.zomeProxy.callEntryDefs(zomeName);
    const def = entryDefs[entryIndex];
    if (!def || !("App" in def.id)) {
      throw Promise.reject("No entryDef found");
    }
    return def.id.App;
  }


  /** */
  async getEntryInfo(zomeIndex: number, entryIndex: number): Promise<[ZomeName, string]> {
    const zomeName = await this.getZomeName(zomeIndex);
    const entryName = await this.getEntryName(zomeName, entryIndex);
    return [zomeName, entryName];
  }
}
