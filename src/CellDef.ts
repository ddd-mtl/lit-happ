import {AgentPubKeyB64, DnaHashB64} from "@holochain-open-dev/core-types";
import {CellId, InstalledCell, RoleId} from "@holochain/client";

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


/** -- Mixin -- */

type Constructor<T> = {new (): T};
type GConstructor<T = {}> = new (...args: any[]) => T;
type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T

class Empty {
  constructor(...args: any[]) {}
}


export interface IZomeSpecific {
  get zomeName(): string;
}


/** */
export function ZomeSpecificMixin<TBase extends AbstractConstructor>(Base: TBase) {
  abstract class Zomy extends Base implements IZomeSpecific {
    static zomeName: string;
    get zomeName(): string {return (this.constructor as any).zomeName}
    setZomeName(name: string): void {(this.constructor as any).zomeName = name}
  };
  return Zomy;
}

export const ZomeSpecific = ZomeSpecificMixin(Empty);



/** */
export function RoleSpecificMixin<TBase extends AbstractConstructor>(Base: TBase) {
  abstract class Roly extends Base {
    static roleId: RoleId;
    get roleId(): RoleId {return (this.constructor as any).roleId}
    setRoleId(name: RoleId): void {(this.constructor as any).roleId = name}
  };
  return Roly;
}

export const RoleSpecific = RoleSpecificMixin(Empty);


// // A TypeScript decorator
// const myDecorator = (proto: ReactiveElement, key: string) => {
//   const ctor = proto.constructor as typeof ReactiveElement;
//
//   ctor.addInitializer((instance: ReactiveElement) => {
//     // This is run during construction of the element
//     new MyController(instance);
//   });
// };
