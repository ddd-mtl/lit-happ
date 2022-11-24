import {AgentPubKeyB64, DnaHashB64} from "@holochain-open-dev/core-types";
import {CellId, InstalledCell, RoleId} from "@holochain/client";

export type Constructor<T> = {new (): T};


/**
 *
 */
export interface ICellDef {
  get cellDef(): InstalledCell;
  get roleId(): RoleId;
  get dnaHash(): DnaHashB64;
  get agentPubKey(): AgentPubKeyB64;
  get cellId(): CellId;
}


// export interface IZomeSpecific {
//    get zomeName(): string;
// }


type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T


type GConstructor<T = {}> = new (...args: any[]) => T;



export function ZomeSpecificMixin<TBase extends AbstractConstructor>(Base: TBase) {
  abstract class Zomy extends Base {
    static zomeName: string;
    getZomeName(): string {return (this.constructor as any).zomeName}
  };
  return Zomy;
}


export class Empty {
  constructor(...args: any[]) {}
}

export const ZomeSpecific = ZomeSpecificMixin(Empty);

// export function ZomeSpecificMixin<TBase>() {
//   return class Derived extends ZomeSpecific {}
// }

// export function ZomeSpecificMixin<TBase extends GConstructor>(Base: TBase) {
//
// }
//
// export function ScopedElementsMixin<T_1 extends import("@open-wc/dedupe-mixin").Constructor<HTMLElement>>(superclass: T_1): T_1 & import("@open-wc/dedupe-mixin").Constructor<import("./types").ScopedElementsHost>;



export declare class ZomeHost {
  constructor(...args: any[]);
  static zomeName: string;
}

export declare function ZomeSpecificMixinImplementation<T extends Constructor<{}>>(
  superclass: T,
): T & Constructor<ZomeHost> & typeof ZomeHost;


//export type ZomeSpecificMixin = typeof ZomeSpecificMixinImplementation;
