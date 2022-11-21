import { Dictionary } from "@holochain-open-dev/core-types";
import { InstalledAppInfo } from "@holochain/client";
import { ReactiveController, ReactiveElement } from "lit";
import { ConductorAppProxy } from "./ConductorAppProxy";
import { IDnaViewModel } from "./DnaViewModel";


/**
 * Stores the DnaViewModels of a happ
 */
 export class HappViewModel /* implements ReactiveController */ {

  /** Ctor */
  constructor(public host: ReactiveElement, public readonly appInfo: InstalledAppInfo, public conductorAppProxy: ConductorAppProxy) {}

  protected _dvms: Dictionary<IDnaViewModel> = {};

  getDvm(name: string): IDnaViewModel | undefined {return this._dvms[name]}

  addDvm(dvm: IDnaViewModel) {
    this._dvms[dvm.roleId] = dvm
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