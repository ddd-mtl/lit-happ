import {CapSecret, FunctionName, ZomeName} from "@holochain/client";
import {CellMixin, ZomeSpecific} from "./mixins";
import {CellProxy} from "./CellProxy";

export type ZomeProxyConstructor = {new(cellProxy: CellProxy, zomeName?: ZomeName): ZomeProxy} & typeof ZomeSpecific;


/**
 * ABC for representing the zome function bindings of a Zome.
 * It holds the zomeName and reference to a CellProxy.
 */
export abstract class ZomeProxy extends CellMixin(ZomeSpecific) {

  abstract readonly FN_NAMES: FunctionName[];

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


  /** Tuple array with zome name */
  get fnNames(): [ZomeName, FunctionName][] {
    return this.FN_NAMES.map((fnName) => {
      return [this.zomeName, fnName]
    })
  }


  /** Helper for calling a zome function on its zome */
  protected async call(fnName: FunctionName, payload: any, maybeSecret?: CapSecret, timeout?: number): Promise<any> {
    //console.log("ZomeProxy.call", this.zomeName)
    if (!this.FN_NAMES.includes(fnName)) {
      Promise.reject(`Function "${fnName}()" not part of zome "${this.zomeName}"`);
    }
    const cap_secret = maybeSecret? maybeSecret : null;
    return this._cellProxy.callZome(this.zomeName, fnName, payload, cap_secret, timeout);
  }

  /** Helper for calling a zome function on its zome */
  protected async callBlocking(fnName: FunctionName, payload: any, maybeSecret?: CapSecret, timeout?: number): Promise<any> {
    //console.log("ZomeProxy.call", this.zomeName)
    if (!this.FN_NAMES.includes(fnName)) {
      Promise.reject(`Function "${fnName}()" not part of zome "${this.zomeName}"`);
    }
    const cap_secret = maybeSecret? maybeSecret : null;
    return this._cellProxy.callZomeBlocking(this.zomeName, fnName, payload, cap_secret, timeout);
  }

}
