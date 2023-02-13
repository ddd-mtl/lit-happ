import {
  FunctionName,
  ZomeName
} from "@holochain/client";
import {Cell} from "./cell";

type Constructor<T> = {new (): T};
type GConstructor<T = {}> = new (...args: any[]) => T;
export type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T


export class Empty {
  constructor(...args: any[]) {}
}


/** ------------------------------------------------------------------------------------------- **/

/**
 * Mixin for Cell bound classes.
 * A Cell bound class must have a "Provisioned" or "Cloned" cell from @holochain/client
 */
export function CellMixin<TBase extends AbstractConstructor>(Base: TBase) {
  abstract class ACell extends Base {
    // constructor(...args: any[]){
    //   super(args);
    // }
    _cell?: Cell;

    get cell(): Cell { if (!this._cell) throw Error("Cell field not set for object") ; return this._cell! }

  }

  return ACell;
}

//export const CellSpecific = CellMixin(Empty);



/** ------------------------------------------------------------------------------------------- **/

/**
 * Mixin for Zome bound classes.
 * A Zome bound class must have a zome name and a list of zome functions
 */
export function ZomeMixin<TBase extends AbstractConstructor>(Base: TBase) {
  abstract class AZomeSpecific extends Base {

    static readonly DEFAULT_ZOME_NAME: ZomeName;
    zomeName: ZomeName;

    static readonly FN_NAMES: FunctionName[];

    constructor(...args: any[]){
      super(args);
      this.zomeName = (this.constructor as typeof AZomeSpecific).DEFAULT_ZOME_NAME
    }

    get defaultZomeName(): ZomeName {
      return (this.constructor as typeof AZomeSpecific).DEFAULT_ZOME_NAME;
    }

    /** Tuple array with zome name */
    get fnNames(): [ZomeName, FunctionName][] {
      const fnNames = (this.constructor as typeof AZomeSpecific).FN_NAMES;
      if (!fnNames) {
        throw Error("FN_NAMES not defined in ZomeProxy subclass " + this.constructor.name);
      }
      return (fnNames as FunctionName[]).map((fnName) => {
        return [this.zomeName, fnName]
      })
    }
  }

  return AZomeSpecific;
}

export const ZomeSpecific = ZomeMixin(Empty);

