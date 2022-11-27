
import {InstalledAppId, RoleId, ZomeName} from "@holochain/client";

type Constructor<T> = {new (): T};
type GConstructor<T = {}> = new (...args: any[]) => T;
type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T

class Empty {
  constructor(...args: any[]) {}
}


/** ------------------------------------------------------------------------------------------- **/

export function ZomeSpecificMixin<TBase extends AbstractConstructor>(Base: TBase) {
  abstract class AZomeSpecific extends Base /*implements IZomeSpecific*/ {
    constructor(...args: any[]){super(); this.zomeName = (this.constructor as any).DEFAULT_ZOME_NAME}
    static readonly DEFAULT_ZOME_NAME: ZomeName;
    zomeName: ZomeName;
  };
  return AZomeSpecific;
}

export const ZomeSpecific = ZomeSpecificMixin(Empty);


/** ------------------------------------------------------------------------------------------- **/

export function RoleSpecificMixin<TBase extends AbstractConstructor>(Base: TBase) {
  abstract class ARoleSpecific extends Base {
    constructor(...args: any[]){super(); this.roleId = (this.constructor as any).DEFAULT_ROLE_ID}
    static readonly DEFAULT_ROLE_ID: RoleId;
    roleId: RoleId;
    //get roleId(): RoleId {return (this.constructor as any).ROLE_ID}
    //setRoleId(name: RoleId): void {(this.constructor as any).ROLE_ID = name}
  };
  return ARoleSpecific;
}

export const RoleSpecific = RoleSpecificMixin(Empty);


/** ------------------------------------------------------------------------------------------- **/

export function HappSpecificMixin<TBase extends AbstractConstructor>(Base: TBase) {
  abstract class AHappSpecific extends Base {
    static readonly happId: InstalledAppId;
    get happId(): InstalledAppId {return (this.constructor as any).happId}
    setHappId(id: InstalledAppId): void {(this.constructor as any).happId = id}
  };
  return AHappSpecific;
}

export const HappSpecific = HappSpecificMixin(Empty);
