import {Dictionary, DnaHashB64} from "@holochain-open-dev/core-types";
import {InstalledAppInfo, InstalledAppId, RoleId} from "@holochain/client";
import { ReactiveElement } from "lit";
import { ConductorAppProxy } from "./ConductorAppProxy";
import {CellIdStr, HvmDef} from "./definitions";
import {DnaViewModel} from "./DnaViewModel";


export type HvmConstructor = {new(installedAppId: InstalledAppId): HappViewModel};

/**
 * "ViewModel" of a hApp
 * Creates and stores all the DnaViewModels from the happDef.
 */
 export class HappViewModel {

  /** Spawn a HappViewModel for an AppId running on the ConductorAppProxy */
  static async new(host: ReactiveElement, conductorAppProxy: ConductorAppProxy, happDef: HvmDef): Promise<HappViewModel> {
    await conductorAppProxy.createCellProxies(happDef);
    return new HappViewModel(host, conductorAppProxy, happDef);
  }

  /** Ctor */
  constructor(
    host: ReactiveElement, /* VIEW */
    conductorAppProxy: ConductorAppProxy, /* MODEL */
    hvmDef: HvmDef,
    ) {
    /** Create all DVMs for this Happ */
    for (const dvmDef of hvmDef.dvmDefs) {
      let dvm: DnaViewModel;
      if (Array.isArray(dvmDef)) {
        dvm = new dvmDef[0](host, hvmDef.id, conductorAppProxy, dvmDef[1]); // WARN this can throw an error
      } else {
        dvm = new dvmDef(host, hvmDef.id, conductorAppProxy); // WARN this can throw an error
      }
      if (dvm.signalHandler) {
        //console.log(`"${dvm.roleId}" signalHandler added`, dvm.signalHandler);
        //conductorAppProxy.addSignalHandler(dvm.signalHandler});
        try {
          conductorAppProxy.addSignalHandler((sig) => {
            dvm.signalHandler!(sig)
          }, dvm.cellId);
        } catch (e) {
          console.error(e)
        }
      }
      this._dvms[dvm.roleId] = dvm;
    }
  }


  protected _dvms: Dictionary<DnaViewModel> = {};

  getDvm(name: RoleId): DnaViewModel | undefined {return this._dvms[name]}

  getDnaHash(name: RoleId): DnaHashB64 {return this._dvms[name].dnaHash}

  // addCloneDvm(roleId: RoleId) {
  //   //this._dvms[dvm.roleId] = dvm
  // }


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
