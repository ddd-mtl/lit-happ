import {Dictionary, DnaHashB64} from "@holochain-open-dev/core-types";
import {InstalledAppInfo, InstalledAppId, RoleId} from "@holochain/client";
import { ReactiveElement } from "lit";
import { ConductorAppProxy } from "./ConductorAppProxy";
import {DvmDef, IDnaViewModel} from "./DnaViewModel";
import { RoleSpecific } from "./mixins";

/** */
export interface HappDef {
 id: InstalledAppId,
 dvmDefs: DvmDef[],
}


export type HvmClass = {new(happ: HappViewModel, roleId: RoleId): IDnaViewModel} & typeof RoleSpecific;


/**
 * Stores the DnaViewModels of a happ
 */
 export class HappViewModel {

  /** Ctor */
  constructor(
    public readonly host: ReactiveElement, 
    public readonly appInfo: InstalledAppInfo, 
    public readonly conductorAppProxy: ConductorAppProxy, 
    dvmDefs: DvmDef[]) {
   /** Create all DVMs for this Happ */
   for (const dvmDef of dvmDefs) {
    let dvm;
    if (Array.isArray(dvmDef)) {
      dvm = new dvmDef[0](this, dvmDef[1]); // WARN this can throw an error
    } else {
      dvm = new dvmDef(this); // WARN this can throw an error
    }
    this._dvms[dvm.roleId] = dvm
   }
  }

  protected _dvms: Dictionary<IDnaViewModel> = {};

  getDvm(name: RoleId): IDnaViewModel | undefined {return this._dvms[name]}

  getDnaHash(name: RoleId): DnaHashB64 {return this._dvms[name].dnaHash}

  addCloneDvm(roleId: RoleId) {
    //this._dvms[dvm.roleId] = dvm
  }


  async probeAll(): Promise<void> {
   for (const dvm of Object.values(this._dvms)) {
    //console.log("Hvm.probeAll() dvm =", dvm.roleId)
    await dvm.probeAll();
   }
  }


  /** QoL Helpers */
  get installedAppId(): InstalledAppId {return this.appInfo.installed_app_id}
 }
