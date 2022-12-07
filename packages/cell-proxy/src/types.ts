import {CellId, InstalledCell} from "@holochain/client";
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

export type RoleCells = {
  original: InstalledCell,
  /** CloneName / Index -> InstalledCell */
  clones: Dictionary<InstalledCell>,
}

/** BaseRoleName -> RoleCells */
export type CellsMap = Dictionary<RoleCells>;
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
