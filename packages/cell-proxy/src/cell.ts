import {
  CellId,
  CellInfo,
  CellType,
  DnaModifiers,
  ProvisionedCell, StemCell, ClonedCell, InstalledAppId
} from "@holochain/client";
import {RoleName} from "@holochain/client/lib/types";
import {HCL} from "./hcl";
import {BaseRoleName} from "./types";
import {AgentId, DnaId, enc64} from "./hash";


export type AnyCell = ProvisionedCell | ClonedCell;


/**
 * Common interface between Provisioned and Cloned cells
 */
export class Cell {

  /** */
  static from(cellInfo: CellInfo, appId: InstalledAppId, baseRoleName: BaseRoleName): Cell {
    if (CellType.Stem in cellInfo) {
      const id = cellInfo.stem.name? cellInfo.stem.name : enc64(cellInfo.stem.dna);
      throw Error("StemCell cannot be converted to Cell: " + id);
    }
    if (CellType.Cloned in cellInfo) {
      return new Cell(cellInfo.cloned, appId, baseRoleName);
    }
    return new Cell(cellInfo.provisioned, appId, baseRoleName);
  }


  /** Ctor */
  constructor(private readonly _cell: AnyCell, public readonly appId: InstalledAppId, public readonly baseRoleName: BaseRoleName) {}


  /** -- Getters -- */

  get id(): CellId { return (this._cell as any).cell_id }
  get dnaId(): DnaId { return new DnaId(this.id[0]) }
  get agentId(): AgentId { return new AgentId(this.id[1]) }
  get name(): string {return (this._cell as any).name}
  get dnaModifiers(): DnaModifiers {return (this._cell as any).dna_modifiers}

  /** ex: rNamedInteger.0 */
  get cloneId(): RoleName | undefined { return (this._cell as any).clone_id }


  /** -- Methods -- */

  hcl(): HCL {return new HCL(this.appId, this.baseRoleName, this.cloneId)}

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
    return `Cell "${this.name}${this.cloneId? "." + this.cloneId: ""}": ${this.dnaId.short}`;
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
