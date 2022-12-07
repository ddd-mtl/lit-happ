import {InstalledAppId} from "@holochain/client";
import {BaseRoleName, CloneIndex, destructureRoleInstanceId, RoleInstanceId} from "./types";


/** -- HCL: Holochain Cell Locator -- */

export type HCLString = string;

/**
 * Even when a clone is named the HCL must know its cloneIndex
 * Examples
 * `cell:/where/profiles`
 * `cell:/chatApp/channel/2`
 * `cell:/chatApp/channel/europe/0`
 */
export class HCL {

  public readonly appId: InstalledAppId;
  public readonly roleInstanceId: RoleInstanceId;
  public readonly baseRoleName: BaseRoleName;

  /** A Cell can have a name and an index */
  public readonly cloneName?: string;
  public readonly cloneIndex?: CloneIndex;

  /** Ctor */
  constructor(appId: InstalledAppId, roleInstanceId: RoleInstanceId);
  constructor(appId: InstalledAppId, baseRoleName: BaseRoleName, cloneIndex: CloneIndex);
  constructor(appId: InstalledAppId, baseRoleName: BaseRoleName, cloneIndex: CloneIndex, cloneName: string);
  constructor(appId: InstalledAppId, role: RoleInstanceId | BaseRoleName, cloneIndex?: CloneIndex, cloneName?: string) {
    this.appId = appId;
    this.baseRoleName = role as BaseRoleName;
    if (cloneName !== undefined) {
      this.cloneName = cloneName;
      this.cloneIndex = cloneIndex;
    } else {
      if (cloneIndex !== undefined) {
        //this.cloneName = String(cloneIndex);
        this.cloneIndex = cloneIndex;
      } else {
        const maybe = destructureRoleInstanceId(role);
        if (maybe !== undefined) {
          this.baseRoleName = maybe[0];
          this.cloneIndex = maybe[1];
        }
      }
    }
    this.roleInstanceId = cloneIndex === undefined
      ? role as RoleInstanceId
      : role + "." + cloneIndex;
  }

  /** */
  static parse(hcl: HCLString): HCL {
    const subs = hcl.split('/');
    //console.log({subs});
    if (subs[0] !== "cell:") throw Error("Bad string format");
    if (subs.length < 3) throw Error("Bad string format. Too few components");
    if (subs.length > 5) throw Error("Bad string format. Too many components");
    if (subs.length == 5) {
      return new HCL(subs[1], subs[2], Number(subs[4]), subs[3]);
    }
    if (subs.length == 4) {
      return new HCL(subs[1], subs[2], Number(subs[3]));
    }
    return new HCL(subs[1], subs[2]);
  }


  /** */
  toString(): HCLString {
    let hcl = "cell:/" + this.appId + "/" + this.baseRoleName
    const maybeCloneName = this.cloneName;
    if (maybeCloneName !== undefined) {
      hcl += "/" + maybeCloneName
    }
    const maybeCloneIndex = this.cloneIndex;
    if (maybeCloneIndex !== undefined) {
      hcl += "/" + maybeCloneIndex
    }
    return hcl;
  }


  isClone(): boolean {
    return this.cloneIndex !== undefined;
  }


  /** */
  match(hcl: HCL): boolean {
    if (this.appId != hcl.appId) return false;
    if (this.baseRoleName != hcl.baseRoleName) return false;
    if (hcl.isClone()) {
      if (!this.isClone()) return false;
      if (hcl.cloneName != this.cloneName) return false;
    }
    return true;
  }

}
