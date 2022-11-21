import { Dictionary } from "@holochain-open-dev/core-types";
import { InstalledAppInfo } from "@holochain/client";
import { ReactiveElement } from "lit";
import { ConductorAppProxy } from "./ConductorAppProxy";
import {DvmClass, IDnaViewModel} from "./DnaViewModel";
import {InstalledAppId, RoleId} from "@holochain/client/lib/types";

/** */
export interface HappDef {
 id: InstalledAppId,
 dvmDefs: [RoleId, DvmClass][],
}

/**
 * Stores the DnaViewModels of a happ
 */
 export class HappViewModel /* implements ReactiveController */ {

  /** Ctor */
  constructor(public host: ReactiveElement, public readonly appInfo: InstalledAppInfo, public conductorAppProxy: ConductorAppProxy, dvmClasses: [RoleId, DvmClass][]) {
   /** Create all DVMs for this Happ */
   for (const [roleId, dvmClass] of dvmClasses) {
    const dvm = new dvmClass(this, roleId); // FIXME this can throw an error
    this._dvms[dvm.roleId] = dvm
   }
  }

  protected _dvms: Dictionary<IDnaViewModel> = {};

  getDvm(name: RoleId): IDnaViewModel | undefined {return this._dvms[name]}

  addCloneDvm(roleId: RoleId) {
    //this._dvms[dvm.roleId] = dvm
  }

  /** Provide context */
  // hostConnected(): void {
  //   console.log("HappController.hostConnected() called")
  //     for (const dvm of Object.values(this._dvms)) {
  //       dvm.provideContext(this._host);
  //     }
  // }

  /** QoL Helpers */
  get installedAppId(): string {return this.appInfo.installed_app_id}
 }
