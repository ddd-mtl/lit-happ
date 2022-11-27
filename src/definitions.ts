import {AgentPubKeyB64, DnaHashB64} from "@holochain-open-dev/core-types";
import {CellId, InstalledAppId, InstalledCell, RoleId, ZomeName} from "@holochain/client";
import { DvmConstructor } from "./DnaViewModel";
import { ZvmConstructor } from "./ZomeViewModel";


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

 
/**
 *
 */
export interface ICellDef {
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
