import {Dictionary, DnaHashB64} from "@holochain-open-dev/core-types";
import {InstalledAppInfo, InstalledAppId, RoleId} from "@holochain/client";
import { ReactiveElement } from "lit";
import { ConductorAppProxy } from "./ConductorAppProxy";
import {DnaViewModel, DvmDef} from "./DnaViewModel";
import { IHappSpecific, RoleSpecific } from "./mixins";

/** */
export interface HappDef {
 id: InstalledAppId,
 dvmDefs: DvmDef[],
}

//export type IHappViewModel = IDnaViewModel & IHappSpecific;


export type HvmClass = {new(installedAppId: InstalledAppId): HappViewModel};


/**
 * "ViewModel" of a hApp
 * Creates and stores all the DnaViewModels from the happDef.
 */
 export class HappViewModel {

  /** Ctor */
  constructor(
    host: ReactiveElement, // VIEW
    conductorAppProxy: ConductorAppProxy, // MODEL 
    //public readonly appInfo: InstalledAppInfo,        
    //installedAppId: InstalledAppId,
    //dvmDefs: DvmDef[],
    happDef: HappDef, 
    ) {
   /** Create all DVMs for this Happ */
   for (const dvmDef of happDef.dvmDefs) {
    let dvm;
    if (Array.isArray(dvmDef)) {
      dvm = new dvmDef[0](host, happDef.id, conductorAppProxy, dvmDef[1]); // WARN this can throw an error
    } else {
      dvm = new dvmDef(host, happDef.id, conductorAppProxy); // WARN this can throw an error
    }
    this._dvms[dvm.roleId] = dvm
   }
  }

  protected _dvms: Dictionary<DnaViewModel> = {};

  getDvm(name: RoleId): DnaViewModel | undefined {return this._dvms[name]}

  getDnaHash(name: RoleId): DnaHashB64 {return this._dvms[name].dnaHash}

  addCloneDvm(roleId: RoleId) {
    //this._dvms[dvm.roleId] = dvm
  }


  /** */
  async probeAll(): Promise<void> {
   for (const dvm of Object.values(this._dvms)) {
    //console.log("Hvm.probeAll() dvm =", dvm.roleId)
    await dvm.probeAll();
   }
  }


  /** QoL Helpers */
  //get installedAppId(): InstalledAppId {return this.appInfo.installed_app_id}
 }
