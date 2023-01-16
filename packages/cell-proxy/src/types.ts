import {
  CellId,
  decodeHashFromBase64,
  encodeHashToBase64,
  AgentPubKeyB64,
  DnaHashB64,
  Cell, RoleName
} from "@holochain/client";
import {AgentPubKey, DnaHash} from "@holochain/client/lib/types";
import {Dictionary} from "./utils";

/**
 *
 */
export interface ICell {
  //get installedCell(): InstalledCell;
  get cell(): Cell;
  //get name(): string;
  get dnaHash(): DnaHashB64;
  get agentPubKey(): AgentPubKeyB64;
  //get cellId(): CellId;

  //get isClone(): boolean;
  //get baseRoleName(): BaseRoleName;
  //get cloneIndex(): CloneIndex;
  //get cloneName(): string;
}

export type BaseRoleName = string;
export type CloneIndex = number;

export type CellsForRole = {
  //baseRoleName: BaseRoleName,
  provisioned: Cell,
  /** CloneId -> Cell */
  clones: Dictionary<Cell>,
}

/** BaseRoleName -> RoleCells */
export type RoleCellsMap = Dictionary<CellsForRole>;


/** -- CloneId -- */
export type CloneId = RoleName;
/** type for string "<baseRoleName>.<cloneIndex>" */
export function createCloneName(baseRoleName: BaseRoleName, cloneIndex: CloneIndex): string {
  //if (!cloneIndex) return baseRoleName as CloneName;
  return "" + baseRoleName + "." + cloneIndex;
}

export function destructureCloneId(cloneId: CloneId): [BaseRoleName, CloneIndex] | undefined {
  const subs = cloneId.split(".");
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
    return "" + encodeHashToBase64(hash_or_id[0]) + CELL_ID_SEPARATOR + encodeHashToBase64(hash_or_id[1]);
  }
  if (!key) {
    throw Error("CellIdStr() failed. AgentPubKey not provided");
  }
  return "" + encodeHashToBase64(hash_or_id) + CELL_ID_SEPARATOR + encodeHashToBase64(key);
}

/** */
export function str2CellId(str: CellIdStr): CellId {
  const subs = str.split(CELL_ID_SEPARATOR);
  if (subs.length != 2) {
    throw Error("str2CellId() failed. Bad input string format");
  }
  return [decodeHashFromBase64(subs[0]), decodeHashFromBase64(subs[1])]
}
