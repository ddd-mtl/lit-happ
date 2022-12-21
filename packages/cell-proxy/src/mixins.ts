import {
  AgentPubKeyB64,
  Cell,
  CellId,
  DnaHashB64,
  encodeHashToBase64,
  InstalledAppId,
  ZomeName
} from "@holochain/client";
import {BaseRoleName} from "./types";

type Constructor<T> = {new (): T};
type GConstructor<T = {}> = new (...args: any[]) => T;
type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T

class Empty {
  constructor(...args: any[]) {}
}


/** ------------------------------------------------------------------------------------------- **/

export function CellMixin<TBase extends AbstractConstructor>(Base: TBase) {
  abstract class ACell extends Base {
    // constructor(...args: any[]){
    //   super(args);
    // }
    _cell?: Cell;

    get cell(): Cell { return this._cell! }
    get cellId(): CellId { return this._cell!.cell_id }
    get dnaHash(): DnaHashB64 { return encodeHashToBase64(this._cell!.cell_id[0]) }
    get agentPubKey(): AgentPubKeyB64 { return encodeHashToBase64(this._cell!.cell_id[1]) }
  };
  return ACell;
}

export const CellSpecific = CellMixin(Empty);



/** ------------------------------------------------------------------------------------------- **/

export function ZomeSpecificMixin<TBase extends AbstractConstructor>(Base: TBase) {
  abstract class AZomeSpecific extends Base {
    constructor(...args: any[]){
      super(args);
      this.zomeName = (this.constructor as any).DEFAULT_ZOME_NAME
    }
    getDefaultZomeName(): ZomeName {
      return (this.constructor as typeof AZomeSpecific).DEFAULT_ZOME_NAME;
  }
    static readonly DEFAULT_ZOME_NAME: ZomeName;
    zomeName: ZomeName;
  };
  return AZomeSpecific;
}

export const ZomeSpecific = ZomeSpecificMixin(Empty);


/** ------------------------------------------------------------------------------------------- **/

export function RoleSpecificMixin<TBase extends AbstractConstructor>(Base: TBase) {
  abstract class ARoleSpecific extends Base {
    constructor(...args: any[]){super(); this.baseRoleName = (this.constructor as any).DEFAULT_BASE_ROLE_NAME}
    static readonly DEFAULT_BASE_ROLE_NAME: BaseRoleName;
    baseRoleName: BaseRoleName;
  };
  return ARoleSpecific;
}

export const RoleSpecific = RoleSpecificMixin(Empty);


/** ------------------------------------------------------------------------------------------- **/

export function HappSpecificMixin<TBase extends AbstractConstructor>(Base: TBase) {
  abstract class AHappSpecific extends Base {
    constructor(...args: any[]){super(); this.happId = (this.constructor as any).DEFAULT_HAPP_ID}
    static readonly DEFAULT_HAPP_ID: InstalledAppId;
    happId: InstalledAppId;
  };
  return AHappSpecific;
}

export const HappSpecific = HappSpecificMixin(Empty);
