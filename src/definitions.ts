import {AgentPubKeyB64, DnaHashB64} from "@holochain-open-dev/core-types";
import {CellId, InstalledAppId, InstalledCell, RoleId, ZomeName} from "@holochain/client";
import { DvmConstructor } from "./DnaViewModel";
import { ZvmConstructor } from "./ZomeViewModel";
import {AgentPubKey, DnaHash} from "@holochain/client/lib/types";
import {deserializeHash, serializeHash} from "@holochain-open-dev/utils";


export type ZvmDef = ZvmConstructor | [ZvmConstructor, ZomeName]; // optional ZomeName override

export type DvmDef = DvmConstructor | [DvmConstructor, RoleId] // optional roleId override


// export interface DnaDef {
//   dnaName: string,
//   zvmDefs: ZvmDef[],
// }

/** */
export interface HvmDef {
  id: InstalledAppId,
  dvmDefs: DvmDef[],
 }

export type CellLocation = [InstalledAppId, RoleId];


export function CellLocation(installedAppId: InstalledAppId, roleId: RoleId): CellLocation {
  return [installedAppId, roleId];
}

/** HCL: Holochain Cell Locator */
export type HCL = string;
export function Hcl(loc_or_appId: InstalledAppId | CellLocation, roleId?: RoleId): HCL {
  if (Array.isArray(loc_or_appId)) {
    return "hcl://" + loc_or_appId[0] + "/" + loc_or_appId[1];
  }
  if (!roleId) {
    throw Error("Hcl() failed. RoleId not provided");
  }
  return "hcl://" + loc_or_appId + "/" + roleId!;
}


export function CellIdStr(hash_or_id: DnaHash | CellId, key?: AgentPubKey): string {
  if (Array.isArray(hash_or_id)) {
    return "" + serializeHash(hash_or_id[0]) + "__" + serializeHash(hash_or_id[1]);
  }
  if (!key) {
    throw Error("CellIdStr() failed. AgentPubKey not provided");
  }
  return "" + serializeHash(hash_or_id) + "__" + serializeHash(key);
}

/** */
export function str2CellId(str: string): CellId {
  const subs = str.split("__")
  if (subs.length != 2) {
    throw Error("str2CellId() failed. Bad input string format");
  }
  return [deserializeHash(subs[0]), deserializeHash(subs[1])]
}

/**
 *
 */
export interface IInstalledCell {
  get installedCell(): InstalledCell;
  get roleId(): RoleId;
  get dnaHash(): DnaHashB64;
  get agentPubKey(): AgentPubKeyB64;
  get cellId(): CellId;
}



// export class MyZomeDef /* implements IZomeSpecific */ {
//   constructor(public readonly zomeDef: ZomeDefinition) {}
//   get zomeName(): ZomeName {return this.zomeDef[0];}
//   get zomeHash(): WasmHash {return this.zomeDef[1].wasm_hash}
//   get zomeDeps(): ZomeName[] {return this.zomeDef[1].dependencies}
// }



// export class MyDnaDef {
//   constructor(public readonly zomeDef: DnaDefinition) {}
//   get dnaName(): string {return this.zomeDef.name}
//   get dnaModifiers(): DnaModifiers { return this.zomeDef.modifiers}
//   get zomeDefs(): ZomeDefinition[] {
//     return this.zomeDef.coordinator_zomes.concat(this.zomeDef.integrity_zomes);
//   }
//   get zomeNames(): ZomeName[] {
//     const coordinators = this.zomeDef.coordinator_zomes.map((zDef) => zDef[0])
//     const integritys =  this.zomeDef.integrity_zomes.map((zDef) => zDef[0])
//     return coordinators.concat(integritys);
//   }
// }
