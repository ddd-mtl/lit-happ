import {CellId, InstalledAppId, InstalledAppInfo, InstalledCell} from "@holochain/client";
import {AgentPubKeyB64, Dictionary, DnaHashB64} from "@holochain-open-dev/core-types";
import {AgentPubKey, DnaHash} from "@holochain/client/lib/types";
import {deserializeHash, serializeHash} from "@holochain-open-dev/utils";

/**
 *
 */
export interface IInstalledCell {
  get installedCell(): InstalledCell;
  get roleInstanceId(): RoleInstanceId;
  get dnaHash(): DnaHashB64;
  get agentPubKey(): AgentPubKeyB64;
  get cellId(): CellId;

  //get isClone(): boolean;
  //get baseRoleName(): BaseRoleName;
  //get cloneIndex(): CloneIndex;
  //get cloneName(): string;
}

export type BaseRoleName = string;
export type CloneIndex = number;

export type RoleInstalledCells = {
  original: InstalledCell,
  /** CloneName / Index -> InstalledCell */
  clones: Dictionary<InstalledCell>,
}

/** BaseRoleName -> RoleInstalledCells */
export type InstalledCellsMap = Dictionary<RoleInstalledCells>;
//export type CellMap = Dictionary<InstalledCell>;



/** -- RoleInstanceId -- */

/** type for string "<baseRoleName>.<cloneIndex>" */
export type RoleInstanceId = string;
export function RoleInstanceId(baseRoleName: BaseRoleName, cloneIndex?: CloneIndex): RoleInstanceId {
  if (!cloneIndex) return baseRoleName as RoleInstanceId;
  return "" + baseRoleName + "." + cloneIndex;
}

export function destructureRoleInstanceId(id: RoleInstanceId): [BaseRoleName, CloneIndex] | undefined {
  const subs = id.split(".");
  if (subs.length != 2) {
    //throw Error(`Bad RoleInstance id format: "${id}"`);
    return undefined;
  }
  return [subs[0] as BaseRoleName, Number(subs[1]) as CloneIndex];
}



/** -- HCL & Cell Location -- */

/** HCL: Holochain Cell Location */
export type HCL = string;

/** */
export class CellLocation {
  constructor(
  public readonly appId: InstalledAppId,
  public readonly roleInstanceId: RoleInstanceId,
  ){}

  /** */
  static from(appId: InstalledAppId, baseRoleName: BaseRoleName, cloneIndex?: CloneIndex): CellLocation {
    const instanceId: RoleInstanceId = cloneIndex === undefined
      ? baseRoleName as RoleInstanceId
      : baseRoleName + "." + cloneIndex;
    return new CellLocation(appId, instanceId);
  }

  // TODO
  //static fromHcl(hcl: HCL): CellLocation {}

  get baseRoleName(): BaseRoleName {
    const maybe = destructureRoleInstanceId(this.roleInstanceId);
    return maybe? maybe[0] : this.roleInstanceId as BaseRoleName
  }

  get cloneIndex(): CloneIndex | undefined {
    const maybe = destructureRoleInstanceId(this.roleInstanceId);
    return maybe? maybe[1] : undefined;
  }

  asHcl(): HCL {
    let hcl = "hcl://" + this.appId + "/" + this.baseRoleName
    const maybeCloneIndex = this.cloneIndex;
    if (maybeCloneIndex !== undefined) {
      hcl += "/" + maybeCloneIndex
    }
    return hcl;
  }
}


// export function Hcl(loc_or_appId: InstalledAppId | CellLocation, baseRoleName?: BaseRoleName): HCL {
//   if (Array.isArray(loc_or_appId)) {
//     let hcl = "hcl://" + loc_or_appId[0] + "/" + loc_or_appId[1];
//     if (loc_or_appId[2] >= 0) {
//       hcl += "/" + loc_or_appId[2];
//     }
//     return hcl;
//   }
//   if (!baseRoleName) {
//     throw Error("Hcl() failed. baseRoleName not provided");
//   }
//   return "hcl://" + loc_or_appId + "/" + baseRoleName!;
// }


/** -- CellIdStr -- */

export type CellIdStr = string;

const CELL_ID_SEPARATOR = "||"

export function CellIdStr(hash_or_id: DnaHash | CellId, key?: AgentPubKey): CellIdStr {
  if (Array.isArray(hash_or_id)) {
    return "" + serializeHash(hash_or_id[0]) + CELL_ID_SEPARATOR + serializeHash(hash_or_id[1]);
  }
  if (!key) {
    throw Error("CellIdStr() failed. AgentPubKey not provided");
  }
  return "" + serializeHash(hash_or_id) + CELL_ID_SEPARATOR + serializeHash(key);
}

/** */
export function str2CellId(str: CellIdStr): CellId {
  const subs = str.split(CELL_ID_SEPARATOR);
  if (subs.length != 2) {
    throw Error("str2CellId() failed. Bad input string format");
  }
  return [deserializeHash(subs[0]), deserializeHash(subs[1])]
}
