
/** ------------------------------------------------------------------------------------------- **/

import {AbstractConstructor, BaseRoleName, Empty} from "@ddd-qc/cell-proxy";
import {InstalledAppId} from "@holochain/client";

/**
 * Mixin for Role bound classes.
 * A Role bound class must have a base RoleName.
 */
export function RoleMixin<TBase extends AbstractConstructor>(Base: TBase) {
  abstract class ARoleSpecific extends Base {
    constructor(...args: any[]) {
      super();
      this.baseRoleName = (this.constructor as typeof ARoleSpecific).DEFAULT_BASE_ROLE_NAME;
    }
    static readonly DEFAULT_BASE_ROLE_NAME: BaseRoleName;
    baseRoleName: BaseRoleName;
  };
  return ARoleSpecific;
}

export const RoleSpecific = RoleMixin(Empty);


/** ------------------------------------------------------------------------------------------- **/

/**
 * Mixin for Happ bound classes.
 * Unused for the moment.
 */
export function HappMixin<TBase extends AbstractConstructor>(Base: TBase) {
  abstract class AHappSpecific extends Base {
    constructor(...args: any[]){super(); this.happId = (this.constructor as typeof AHappSpecific).DEFAULT_HAPP_ID}
    static readonly DEFAULT_HAPP_ID: InstalledAppId;
    happId: InstalledAppId;
  };
  return AHappSpecific;
}

export const HappSpecific = HappMixin(Empty);
