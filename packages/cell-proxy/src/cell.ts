import {
  CellInfo,
  CellType,
  DnaModifiers,
  ProvisionedCell, StemCell, ClonedCell, InstalledAppId,
} from "@holochain/client";
import {RoleName} from "@holochain/client/lib/types";
import {HCL} from "./hcl";
import {AnyCell, BaseRoleName, CellAddress} from "./types";
import {enc64} from "./hash";
import {encodeDnaJoiningInfo} from "./dnaJoiningInfo";



/**
 * Common interface between Provisioned and Cloned cells
 */
export class Cell {

  /** */
  static from(cellInfo: CellInfo, appId: InstalledAppId, baseRoleName: BaseRoleName): Cell {
    if (CellType.Stem == cellInfo.type) {
      const stem = cellInfo.value as StemCell;
      const id = stem.name? stem.name : enc64(stem.dna);
      throw Error("StemCell cannot be converted to Cell: " + id);
    }
      return new Cell(cellInfo.value, appId, baseRoleName);
  }

  private readonly _address: CellAddress;

  /** Ctor */
  constructor(private readonly _cell: AnyCell, public readonly appId: InstalledAppId, public readonly baseRoleName: BaseRoleName) {
    this._address = CellAddress.from((this._cell as any).cell_id);
  }


  /** -- Getters -- */

  //get id(): CellId { return (this._cell as any).cell_id }
  //get dnaId(): DnaId { return new DnaId(this.id[0]) }
  //get agentId(): AgentId { return new AgentId(this.id[1]) }

  get address(): CellAddress { return this._address; }

  get name(): string {return (this._cell as any).name}
  get dnaModifiers(): DnaModifiers {return (this._cell as any).dna_modifiers}

  /** ex: rNamedInteger.0 */
  get cloneId(): RoleName | undefined { return (this._cell as any).clone_id }

  get shareCode(): string { return encodeDnaJoiningInfo(this.address.dnaId.hash, this.name, this.dnaModifiers.network_seed) }

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
    return `Cell "${this.name}${this.cloneId? "." + this.cloneId: ""}": ${this._address.dnaId.short}`;
  }
}



/** ... */
export function intoStem(cellInfo: CellInfo): StemCell | undefined {
  if (CellType.Stem == cellInfo.type) {
    return cellInfo.value as StemCell;
  }
  return undefined
}

/** ... */
export function asCell(cellInfo: CellInfo): AnyCell | undefined {
  switch (cellInfo.type) {
    case CellType.Stem: return undefined; break;
    case CellType.Cloned: return cellInfo.value as ClonedCell; break;
    case CellType.Provisioned:return cellInfo.value as ProvisionedCell; break;
  }
  return undefined;
}
