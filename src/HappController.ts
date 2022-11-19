import { Dictionary } from "@holochain-open-dev/core-types";
import { InstalledAppId, InstalledAppInfo } from "@holochain/client";
import { ReactiveController } from "lit";
import { ConductorAppProxy } from "./ConductorAppProxy";
import { IDnaViewModel } from "./DnaViewModel";


/**
 * Provides the DnaViewModels for a happ
 */
 export class HappController /*implements ReactiveController*/ {

  /** Ctor */
  constructor(public readonly appInfo: InstalledAppInfo, public conductorAppProxy: ConductorAppProxy) {}

  protected _dvms: Dictionary<IDnaViewModel> = {};

  getDvm(name: string): IDnaViewModel | undefined {return this._dvms[name]}

  addDvm(dvm: IDnaViewModel) {
    this._dvms[dvm.roleId] = dvm
  }

  // /** */
  // protected async addDnaViewModel(vmClass: {new(dnaClient: DnaProxy): IZomeViewModel}) {
  //   const vm = new vmClass(this._dnaClient);
  //   vm.provideContext(this.host);
  //   this._allEntryTypes[vm.zomeName] = await vm.getEntryDefs();
  //   this._zomeViewModels[vm.zomeName] = vm;
  // }

 }