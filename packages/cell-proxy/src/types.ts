import {
  CellId,
  RoleName, ClonedCell, ProvisionedCell, ZomeName, FunctionName,
} from "@holochain/client";
import {Dictionary} from "./utils";
import {AgentId, dec64, DnaId, enc64} from "./hash";
import {SystemSignalProtocol} from "./zomeSignals.types";
//import {AgentPubKey} from "@holochain/client/lib/types";


/** Signal types */

export enum SignalType  {
  Unknown = "Unknown",
  Empty = "Empty",
  Zome = "Zome",
}

export type SystemPulse = {System: SystemSignalProtocol}

//
// //export type SignalPayload = unknown | LitHappSignal;

// export interface LitHappSignal {
//   from: AgentPubKey,
//   pulses: unknown[],
// }
//
// /** Protocol for notifying the ViewModel (UI) of system level events */
// export type SystemSignalProtocolVariantPostCommitNewStart = {
//   type: "PostCommitNewStart"
//   app_entry_type: string
// }
// export type SystemSignalProtocolVariantPostCommitNewEnd = {
//   type: "PostCommitNewEnd"
//   app_entry_type: string
//   succeeded: boolean
// }
// export type SystemSignalProtocolVariantPostCommitDeleteStart = {
//   type: "PostCommitDeleteStart"
//   app_entry_type: string
// }
// export type SystemSignalProtocolVariantPostCommitDeleteEnd = {
//   type: "PostCommitDeleteEnd"
//   app_entry_type: string
//   succeeded: boolean
// }
// export type SystemSignalProtocolVariantSelfCallStart = {
//   type: "SelfCallStart"
//   zome_name: string
//   fn_name: string
// }
// export type SystemSignalProtocolVariantSelfCallEnd = {
//   type: "SelfCallEnd"
//   zome_name: string
//   fn_name: string
//   succeeded: boolean
// }
// export type SystemSignalProtocol =
//   | SystemSignalProtocolVariantPostCommitNewStart
//   | SystemSignalProtocolVariantPostCommitNewEnd
//   | SystemSignalProtocolVariantPostCommitDeleteStart
//   | SystemSignalProtocolVariantPostCommitDeleteEnd
//   | SystemSignalProtocolVariantSelfCallStart
//   | SystemSignalProtocolVariantSelfCallEnd;
//

/** ---- */

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
  id: DnaId,
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


/** */
export function decomposeCellId(cellId: CellId): [DnaId, AgentId] {
  return [new DnaId(cellId[0]), new AgentId(cellId[1])]
}


/** -- CellIdStr -- */

export type CellIdStr = string;

const CELL_ID_SEPARATOR = "||"

export function CellIdStr(dna_or_cell_id: DnaId | CellId, key?: AgentId): CellIdStr {
  if (Array.isArray(dna_or_cell_id)) {
    return "" + enc64(dna_or_cell_id[0]) + CELL_ID_SEPARATOR + enc64(dna_or_cell_id[1]);
  }
  if (!key) {
    throw Error("CellIdStr() failed. AgentPubKey not provided");
  }
  return "" + dna_or_cell_id.b64 + CELL_ID_SEPARATOR + key.b64;
}

/** */
export function str2CellId(str: CellIdStr): CellId {
  const subs = str.split(CELL_ID_SEPARATOR);
  if (subs.length != 2) {
    throw Error("str2CellId() failed. Bad input string format");
  }
  return [dec64(subs[0]), dec64(subs[1])]
}
