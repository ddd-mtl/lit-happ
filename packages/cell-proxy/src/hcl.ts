import {InstalledAppId, RoleName} from "@holochain/client";
import {BaseRoleName, CloneIndex, destructureCloneName, CloneName} from "./types";


/** -- HCL: Holochain Cell Locator -- */

export type HCLString = string;

/**
 * `cell:/<appId>/<BaseRoleName>/<cloneName>`
 * Examples
 * `cell:/where/profiles`
 * `cell:/chatApp/channel/channel.2`
 * `cell:/chatApp/channel/europe`
 */
export class HCL {

  public readonly appId: InstalledAppId;
  //public readonly roleInstanceId: RoleInstanceId;
  public readonly baseRoleName: BaseRoleName;

  /** A Cell can have a ncloneId */
  public readonly cloneId?: string;

  /** Ctor */
  constructor(appId: InstalledAppId, role: BaseRoleName, cloneId?: RoleName) {
    this.appId = appId;
    this.baseRoleName = role;
    this.cloneId = cloneId;
  }


  /** */
  static parse(sHcl: HCLString): HCL {
    const subs = sHcl.split('/');
    //console.log({subs});
    if (subs[0] !== "cell:") throw Error("HCL.parse() Bad string format: " + sHcl);
    if (subs.length < 2) throw Error("HCL.parse() Bad string format. Too few components: " + sHcl);
    if (subs.length > 4) throw Error("HCL.parse() Bad string format. Too many components: " + sHcl);
    if (subs.length == 4) {
      return new HCL(subs[1], subs[2], subs[3]);
    }
    return new HCL(subs[1], subs[2]);
  }


  /** */
  toString(): HCLString {
    let hcl = "cell:/" + this.appId + "/" + this.baseRoleName
    const maybeCloneName = this.cloneId;
    if (this.isClone()) {
      hcl += "/" + this.cloneId
    }
    return hcl;
  }


  isClone(): boolean {
    return this.cloneId !== undefined;
  }


  /** */
  match(hcl: HCL): boolean {
    if (this.appId != hcl.appId) return false;
    if (this.baseRoleName != hcl.baseRoleName) return false;
    if (hcl.isClone()) {
      if (!this.isClone()) return false;
      if (hcl.cloneId != this.cloneId) return false;
    }
    return true;
  }

}
