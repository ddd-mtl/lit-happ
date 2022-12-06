import {DnaProperties, InstalledAppId, MembraneProof, NetworkSeed, Timestamp, ZomeName} from "@holochain/client";
import { DvmConstructor } from "./DnaViewModel";
import { ZvmConstructor } from "./ZomeViewModel";
import {BaseRoleName} from "@ddd-qc/cell-proxy";


export type ZvmDef = ZvmConstructor | [ZvmConstructor, ZomeName]; // optional ZomeName override

// export type DvmDef = DvmConstructor
//   | [DvmConstructor, BaseRoleName]
//   //| [DvmConstructor, BaseRoleName, DnaModifiers] // optional overrides


export interface DvmDef {
  ctor: DvmConstructor,
  baseRoleName?: BaseRoleName, // optional BaseRoleName override
  isClonable: boolean,
  //canCreateOnInstall: boolean,
}


export interface DnaModifiersOptions {
  network_seed?: NetworkSeed;
  properties?: DnaProperties;
  origin_time?: Timestamp;
}



export interface CellDef {
  modifiers: DnaModifiersOptions,
  membraneProof?: MembraneProof,
  cloneName?: string,
}


// export interface DnaDef {
//   dnaName: string,
//   zvmDefs: ZvmDef[],
// }

/** */
export interface HvmDef {
  id: InstalledAppId,
  dvmDefs: DvmDef[],
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
