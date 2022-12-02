import {Dictionary} from "@holochain-open-dev/core-types";
import {InstalledAppId, RoleId} from "@holochain/client";
import { ReactiveElement } from "lit";
import { ConductorAppProxy } from "./ConductorAppProxy";
import {HvmDef} from "./definitions";
import {DnaViewModel} from "./DnaViewModel";


//export type HvmConstructor = {new(installedAppId: InstalledAppId): HappViewModel};

/**
 * "ViewModel" of a hApp
 * Creates and stores all the DnaViewModels from the happDef.
 */
 export class HappViewModel {

  /** -- Fields -- */
  protected _dvms: Dictionary<DnaViewModel> = {};
  readonly installedAppId: InstalledAppId;

  /** -- Getters -- */
  getDvm(name: RoleId): DnaViewModel | undefined {return this._dvms[name]}


  /** -- Create -- */

  /** Spawn a HappViewModel for an AppId running on the ConductorAppProxy */
  static async new(host: ReactiveElement, conductorAppProxy: ConductorAppProxy, hvmDef: HvmDef): Promise<HappViewModel> {
    await conductorAppProxy.createCellProxies(hvmDef);
    return new HappViewModel(host, conductorAppProxy, hvmDef);
  }

  /** */
  private constructor(
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
    this.installedAppId = hvmDef.id;
  }

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


  /** */
  dumpLogs(roleId?: RoleId): void {
    if (roleId) {
      const dvm = this.getDvm(roleId);
      if (dvm) {
        dvm.dumpLogs();
      } else {
        console.error(`dumpLogs() failed. Role "${roleId}" not found in happ "${this.installedAppId}"`)
      }
    } else {
      for (const dvm of Object.values(this._dvms)) {
        dvm.dumpLogs();
      }
    }
  }
 }
