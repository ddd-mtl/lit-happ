import {AdminWebsocket, ClonedCell, CreateCloneCellRequest, InstalledAppId} from "@holochain/client";
import { ReactiveElement } from "lit";
import {
  AppProxy,
  BaseRoleName, CellAddress,
  CloneIndex,
  createCloneName,
  Dictionary,
  HCL,
} from "@ddd-qc/cell-proxy";
import { CellDef, DvmDef, HvmDef } from "./definitions";
import { DnaViewModel } from "./DnaViewModel";
import { AppSignal } from "@holochain/client/lib/api/app/types";


//export type HvmConstructor = {new(installedAppId: InstalledAppId): HappViewModel};


/**
 * "ViewModel" of a hApp
 * Creates and stores all the DnaViewModels from the happDef.
 */
export class HappViewModel {

  /** -- Fields -- */
  readonly appId: InstalledAppId;
  /** HCLString -> DnaViewModel */
  protected _dvmMap: Dictionary<DnaViewModel> = {};
  /** BaseRoleName -> DvmDef */
  protected _defMap: Dictionary<DvmDef> = {};


  protected _adminWs?: AdminWebsocket;

  /** -- Getters -- */

  /** */
  getDef(name: BaseRoleName): DvmDef | undefined {
    return this._defMap[name];
  }

  /** */
  getCellDvms(cellId: CellAddress): Dictionary<DnaViewModel> | undefined {
    const hcls = this._appProxy.getLocations(cellId);
    if (hcls === undefined) return undefined;
    let dict: Dictionary<DnaViewModel> = {};
    for (const hcl of hcls) {
      const maybe = this.getDvm(hcl);
      if (maybe) {
        dict[hcl.toString()] = maybe;
      }
    }
    return dict;
  }

  /** */
  getDvm(hclOrId: HCL | BaseRoleName ): DnaViewModel | undefined {
    if (typeof hclOrId === 'string') {
      hclOrId = new HCL(this.appId, hclOrId);
    }
    return this._dvmMap[hclOrId.toString()];
  }


  /** */
  getClones(baseRoleName: BaseRoleName): DnaViewModel[] {
    const searchHcl = new HCL(this.appId, baseRoleName);
    let cloneDvms = [];
    for (const [sHcl, dvm] of Object.entries(this._dvmMap)) {
      const hcl = HCL.parse(sHcl);
      if (hcl.isClone() && hcl.match(searchHcl)) {
        cloneDvms.push(dvm);
      }
    }
    return cloneDvms;
  }


  /** -- Create -- */

  /** Spawn a HappViewModel for an AppId running on the AppProxy */
  static async new(host: ReactiveElement, appProxy: AppProxy, hvmDef: HvmDef): Promise<HappViewModel> {
    const appId = appProxy.appIdOfShame? appProxy.appIdOfShame : hvmDef.id;
    //console.log("HappViewModel.new()", hvmDef.id, appId)
    /** Create all Cell Proxies in the definition */
    for (const dvmDef of hvmDef.dvmDefs) {
      if (dvmDef.ctor.DEFAULT_BASE_ROLE_NAME === undefined) {
        return Promise.reject("static field DEFAULT_BASE_ROLE_NAME not defined for class " + dvmDef.ctor.name);
      }
      const baseRoleName = dvmDef.baseRoleName
        ? dvmDef.baseRoleName
        : dvmDef.ctor.DEFAULT_BASE_ROLE_NAME;
      await appProxy.fetchCells(appId, baseRoleName);
      const hcl = new HCL(appId, baseRoleName);
      appProxy.createCellProxy(hcl);
    }
    const hvm = new HappViewModel(host, appProxy, hvmDef);
    return hvm;
  }


  /** Ctor */
  private constructor(
    protected _host: ReactiveElement, /* VIEW */
    protected _appProxy: AppProxy, /* MODEL */
    hvmDef: HvmDef, /* VIEW-MODEL definition */
  ) {
    this.appId = this._appProxy.appIdOfShame? this._appProxy.appIdOfShame : hvmDef.id;
    /** Create all non-deferred DVMs for this Happ */
    for (const dvmDef of hvmDef.dvmDefs) {
      this.createOriginalDvm(dvmDef);
    }
    this.createStartingClonesDvm();
    //console.log("HappViewModel created", this._dvmMap)
  }


  /** -- Methods -- */

  async authorizeAllZomeCalls(adminWs?: AdminWebsocket): Promise<void> {
    if (!adminWs) {
      return;
    }
    for (const [_sHcl, dvm] of Object.entries(this._dvmMap)) {
      //console.log("Authorizing", sHcl);
      await dvm.authorizeZomeCalls(adminWs);
    }
  }

  /** */
  private createStartingClonesDvm(): void {
    const appInstalledCells = this._appProxy.getAppCells(this.appId)!;
    for (const [baseRoleName, roleCells] of Object.entries(appInstalledCells)) {
      const def = this._defMap[baseRoleName];
      if (!def) {
        throw Error("No definition found for given baseRoleName");
      }
      for (const [cloneId, clone] of Object.entries(roleCells.clones)) {
        const hcl = new HCL(this.appId, baseRoleName, cloneId);
        this._appProxy.createCellProxy(hcl, clone.name);
        this.createDvm(def, hcl);
      }
    }
  }


  /** */
  private createDvm(dvmDef: DvmDef, hcl: HCL): DnaViewModel {
    const dvm: DnaViewModel = new dvmDef.ctor(this._host, this._appProxy, hcl); // WARN this can throw an error
    //console.log(`  createDvm() for "${hcl.toString()}" ; cellId: ${CellIdStr(dvm.cellId)}`);
    /** Setup signalHandler */
    if (dvm.signalHandler) {
      //console.log(`"${dvm.baseRoleName}" signalHandler added`, dvm.signalHandler);
      try {
        this._appProxy.addSignalHandler((sig: AppSignal) => {
          dvm.signalHandler!(sig)
        }, hcl.toString());
      } catch (e) {
        console.error(e)
      }
    }
    /** Store it */
    if (this._dvmMap[hcl.toString()]) {
      throw Error("DVM already exists for " + hcl.toString());
    }
    this._dvmMap[hcl.toString()] = dvm;
    /** Done */
    return dvm;
  }


  /** */
  private createOriginalDvm(dvmDef: DvmDef): void {
    /** Determine baseRoleName */
    const baseRoleName = dvmDef.baseRoleName
      ? dvmDef.baseRoleName
      : dvmDef.ctor.DEFAULT_BASE_ROLE_NAME;
    //console.log("createOriginalDvm() for ", baseRoleName);
    if (this._defMap[baseRoleName]) {
      throw Error(`createOriginalDvm() failed. DVM for original cell of ${baseRoleName} already exists.`);
    }
    const hcl = new HCL(this.appId, baseRoleName);
    this.createDvm(dvmDef, hcl);
    this._defMap[baseRoleName] = dvmDef;
  }


  /** */
  async cloneDvm(baseRoleName: BaseRoleName, cellDef?: CellDef): Promise<[ClonedCell, DnaViewModel]> {
    //console.log("createCloneDvm()", baseRoleName);
    /** Check preconditions */
    const def = this._defMap[baseRoleName];
    if (!def) {
      return Promise.reject(`createCloneDvm() failed for ${baseRoleName}. No original DVM created.`)
    }
    if (!def.isClonable) {
      return Promise.reject(`createCloneDvm() failed. Role "${baseRoleName}" is not clonable.`)
    }
    /** Get cloneIndex */
    const clones = this.getClones(baseRoleName);
    const cloneIndex: CloneIndex = clones.length;
    const cloneName = cellDef && cellDef.cloneName
      ? cellDef.cloneName
      : createCloneName(baseRoleName, cloneIndex);
    /** Build default request */
    let request: CreateCloneCellRequest = {
      //app_id: this.appId,
      role_name: baseRoleName,
      modifiers: {
        network_seed: String(cloneIndex),
      },
      name: cloneName,
    }
    /** Modify request according to CellDef */
    if (cellDef) {
      request.modifiers = cellDef.modifiers;
      if (cellDef.membraneProof) request.membrane_proof = cellDef.membraneProof;
      if (cellDef.cloneName) request.name = cellDef.cloneName;
    }
    /** Create Cell */
    const clonedCell = await this._appProxy.createCloneCell(request);
    //console.log("clone created:", CellIdStr(cloneInstalledCell.cell_id));
    const cell = await this._appProxy.fetchCell(this.appId, CellAddress.from(clonedCell.cell_id));
    console.log("clone created:", cell);
    const hcl = new HCL(this.appId, baseRoleName, cell.cloneId);
    /** Get created cell */
    const clone = cell.asCloned()!;
    this._appProxy.addClone(hcl, clone);
    /** Create CellProxy */
    this._appProxy.createCellProxy(hcl, clone.name);
    /** Create DVM and authorize */
    const dvm = this.createDvm(def, hcl);
    if (this._adminWs) {
      await dvm.authorizeZomeCalls(this._adminWs);
    }
    /** Done */
    return [clonedCell, dvm];
  }


  /** */
  probeAll(): void {
    for (const dvm of Object.values(this._dvmMap)) {
      dvm.probeAll();
    }
  }


  /** */
  async initializePerspectiveOnline(): Promise<void> {
    const all = [];
    for (const dvm of Object.values(this._dvmMap)) {
      const p = dvm.initializePerspectiveOnline();
      all.push(p);
    }
    await Promise.all(all);
  }


  /** */
  async initializePerspectiveOffline(): Promise<void> {
    const all = [];
    for (const dvm of Object.values(this._dvmMap)) {
      const p = dvm.initializePerspectiveOffline();
      all.push(p);
    }
    await Promise.all(all);
  }


  /** */
  dumpCallLogs(baseRoleName?: BaseRoleName): void {
    if (baseRoleName) {
      const dvm = this.getDvm(baseRoleName);
      if (dvm) {
        dvm.dumpCallLogs();
      } else {
        console.error(`dumpCallLogs() failed. Role "${baseRoleName}" not found in happ "${this.appId}"`)
      }
    } else {
      for (const dvm of Object.values(this._dvmMap)) {
        dvm.dumpCallLogs();
      }
    }
  }
}
