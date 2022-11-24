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


/** -- ZomeSpecificMixin -- */

type Constructor<T> = {new (): T};
type GConstructor<T = {}> = new (...args: any[]) => T;
type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T


/** */
export function ZomeSpecificMixin<TBase extends AbstractConstructor>(Base: TBase) {
  abstract class Zomy extends Base {
    static zomeName: string;
    get zomeName(): string {return (this.constructor as any).zomeName}
    setZomeName(name: string): void {(this.constructor as any).zomeName = name}
  };
  return Zomy;
}


class Empty {
  constructor(...args: any[]) {}
}

export const ZomeSpecific = ZomeSpecificMixin(Empty);
