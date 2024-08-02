import {
  CellId,
  RoleName, ClonedCell, ProvisionedCell, ZomeName, FunctionName,
} from "@holochain/client";
import {Dictionary} from "./utils";
import {AgentId, DnaId} from "./hash";
import {SystemSignalProtocol} from "./zomeSignals.types";


export type AnyCell = ProvisionedCell | ClonedCell;

/** Signal types */

export enum SignalType  {
  Unknown = "Unknown",
  Empty = "Empty",
  Zome = "Zome",
}

export type SystemPulse = {System: SystemSignalProtocol}


/** ---- */

export type BaseRoleName = string;
export type CloneIndex = number;

export type ZomeIndex = number;

export type EntryDef = {
  id: { App: string } | { CapClaim: null } | { CapGrant: null },
  visibility: "Public" | "Private",
  requiredValidations: number,
  cacheAtAgentActivity: boolean,
}

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
export function flattenCells(cells: CellsForRole): CellAddress[] {
  let res: CellAddress[] = Object.entries(cells.clones).map(([cloneId, clone]) => CellAddress.from(clone.cell_id));
  res.push(CellAddress.from(cells.provisioned.cell_id));
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


/** -- CellAddress -- */

export type CellIdStr = string;

const CELL_ID_SEPARATOR = "||"


export class CellAddress {
  constructor(public readonly dnaId: DnaId, public readonly agentId: AgentId) {}

  static from(id_or_str: CellId | CellIdStr): CellAddress {
    if (typeof id_or_str == 'string') {
      const subs = id_or_str.split(CELL_ID_SEPARATOR);
      if (subs.length != 2) {
        throw Error("CellAddress.from() failed. Bad input string format");
      }
      return new CellAddress(new DnaId(subs[0]), new AgentId(subs[1]));
    }
    return new CellAddress(new DnaId(id_or_str[0]), new AgentId(id_or_str[1]));
  }

  intoId(): CellId {
    //return [new HoloHash(this.dnaId.hash), new HoloHash(this.agentId.hash)]
    return [this.dnaId.hash, this.agentId.hash];
  }

  // Don't autoconvert to string as this can lead to confusions. Have convert to string be explicit
  toString(): string {throw Error("Implicit conversion of HolochainId to string")}


  get str(): CellIdStr {
    return "" + this.dnaId.b64 + CELL_ID_SEPARATOR + this.agentId.b64;
  }

  /** */
  equals(other: CellAddress): boolean {
    return this.str == other.str;
  }
}


