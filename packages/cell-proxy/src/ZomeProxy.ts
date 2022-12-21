import {CapSecret, ZomeName} from "@holochain/client";
import {CellMixin, ZomeSpecific} from "./mixins";
import {CellProxy} from "./CellProxy";

export type ZomeProxyConstructor = {new(cellProxy: CellProxy, zomeName?: ZomeName): ZomeProxy} & typeof ZomeSpecific;


/**
 * ABC for representing the zome function bindings of a Zome.
 * It holds the zomeName and reference to a CellProxy.
 */
export abstract class ZomeProxy extends CellMixin(ZomeSpecific) {

  /** Ctor */
  constructor(protected _cellProxy: CellProxy, zomeName?: ZomeName) {
    super();
    if (zomeName) {
      this.zomeName = zomeName;
    } else {
      if (!this.getDefaultZomeName()) {
        throw Error("zomeName not defined in ZomeProxy subclass " + this.constructor.name);
      }
    }
    this._cell = _cellProxy.cell;
  }


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
