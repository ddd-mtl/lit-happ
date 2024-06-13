import {
  CellId,
  decodeHashFromBase64,
  encodeHashToBase64,
  RoleName, ClonedCell, ProvisionedCell, ZomeName, FunctionName,
} from "@holochain/client";
import {AgentPubKey, DnaHash} from "@holochain/client/lib/types";
import {Dictionary} from "./utils";
import {SystemSignalProtocol} from "./AppProxy";

export enum SignalType  {
  Unknown = "Unknown",
  System = "System",
  LitHapp = "LitHapp",
}


export type SignalPayload = unknown | SystemSignal | LitHappSignal;
export type SystemSignal = {System: SystemSignalProtocol}
export interface LitHappSignal {
  from: AgentPubKey,
  pulses: unknown[],
}

export type BaseRoleName = string;
export type CloneIndex = number;

export type ZomeIndex = number;

export type EntryDef = any; // FIXME
export type EntryDefsCallbackResult = {Defs: EntryDef[]}

export type ScopedZomeTypes = [ZomeIndex, number[]][];

export type ScopedZomeTypesSet = {
  entries: ScopedZomeTypes, // EntryDefIndex
  links: ScopedZomeTypes, // LinkType
};

export type ZomeInfo = {
  name: ZomeName,
  id: ZomeIndex,
  properties: Uint8Array,
  entry_defs: EntryDef[],
  extern_fns: FunctionName[],
  zome_types: ScopedZomeTypesSet,
}


export type DnaInfo = {
  name: string,
  hash: DnaHash,
  properties: Uint8Array,
  zome_names: ZomeName[],
}

/** */
export type CellsForRole = {
  //baseRoleName: BaseRoleName,
  provisioned: ProvisionedCell,
  /** CloneId -> Cell */
  clones: Dictionary<ClonedCell>,
}

/** BaseRoleName -> RoleCells */
export type RoleCellsMap = Dictionary<CellsForRole>;

/** */
export function flattenCells(cells: CellsForRole): CellId[] {
  let res: CellId[] = Object.entries(cells.clones).map(([cloneId, clone]) => clone.cell_id);
  res.push(cells.provisioned.cell_id);
  return res;
}


/** -- CloneId -- */
export type CloneId = RoleName;
/** type for string "<baseRoleName>.<cloneIndex>" */
export function createCloneName(baseRoleName: BaseRoleName, cloneIndex: CloneIndex): string {
  //if (!cloneIndex) return baseRoleName as CloneName;
  return "" + baseRoleName + "." + cloneIndex;
}

/** */
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
