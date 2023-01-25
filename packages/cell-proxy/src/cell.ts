import {
  AgentPubKeyB64,
  CellId,
  CellInfo,
  CellType,
  DnaHashB64,
  DnaModifiers,
  encodeHashToBase64,
  ProvisionedCell, StemCell, ClonedCell
} from "@holochain/client";
import {CellProxy} from "./CellProxy";
import {RoleName} from "@holochain/client/lib/types";


export type AnyCell = ProvisionedCell | ClonedCell;


/**
 * Common interface between Provisioned and Cloned cells
 */
export class Cell {

  /** */
  static from(cellInfo: CellInfo): Cell {
    if (CellType.Stem in cellInfo) {
      const id = cellInfo.stem.name? cellInfo.stem.name : encodeHashToBase64(cellInfo.stem.dna);
      throw Error("StemCell cannot be converted to Cell: " + id);
    }
    if (CellType.Cloned in cellInfo) {
      return new Cell(cellInfo.cloned);
    }
    return new Cell(cellInfo.provisioned);
  }


  /** Ctor */
  constructor(private readonly _cell: AnyCell) {}


  /** -- Getters -- */

  get id(): CellId { return (this._cell as any).cell_id }
  get dnaHash(): DnaHashB64 { return encodeHashToBase64(this.id[0]) }
  get agentPubKey(): AgentPubKeyB64 { return encodeHashToBase64(this.id[1]) }
  get name(): string {return (this._cell as any).name}
  get dnaModifiers(): DnaModifiers {return (this._cell as any).dna_modifiers}

  get cloneId(): RoleName | undefined { return (this._cell as any).clone_id }


  /** -- Methods -- */


  asCloned(): ClonedCell | null {
    if (!this.cloneId) { return null}
    return this._cell as ClonedCell;
  }

  asProvisioned(): ProvisionedCell | null {
    if (this.cloneId) { return null}
    return this._cell as ProvisionedCell;
  }

  /** */
  print(): string {
    return `Cell "${this.name}${this.cloneId? "." + this.cloneId: ""}": ${this.dnaHash}`;
  }
}



/** ... */
export function intoStem(cellInfo: CellInfo): StemCell | undefined {
  if (CellType.Stem in cellInfo) {
    return cellInfo.stem;
  }
  return undefined
}

/** ... */
export function asCell(cellInfo: CellInfo): AnyCell | undefined {
  if (CellType.Stem in cellInfo) {
    return undefined;
  }
  if (CellType.Cloned in cellInfo) {
    return cellInfo.cloned;
  }
  if (CellType.Provisioned in cellInfo) {
    return cellInfo.provisioned;
  }
  return undefined;
}
