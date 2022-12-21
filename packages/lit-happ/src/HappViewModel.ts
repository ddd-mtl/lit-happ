import {Cell, CreateCloneCellRequest, InstalledAppId} from "@holochain/client";
import { ReactiveElement } from "lit";
import {
  BaseRoleName,
  CellIdStr,
  CellsMap,
  CloneIndex,
  ConductorAppProxy,
  Dictionary,
  HCL,
  RoleInstanceId
} from "@ddd-qc/cell-proxy";
import {CellDef, DvmDef, HvmDef} from "./definitions";
import {DnaViewModel} from "./DnaViewModel";
import {AppSignal} from "@holochain/client/lib/api/app/types";
import {CellId, RoleName} from "@holochain/client/lib/types";
import {DnaModifiers} from "@holochain/client/lib/api/admin/types";


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


  /** -- Getters -- */

  /** */
  getDef(name: BaseRoleName): DvmDef | undefined {
    return this._defMap[name];
  }

  /** */
  getCellDvms(cellId: CellId): Dictionary<DnaViewModel> | undefined {
    const hcls = this._conductorAppProxy.getLocations(cellId);
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
  getDvm(hclOrId: HCL | RoleInstanceId): DnaViewModel | undefined {
    if (typeof  hclOrId === 'string') {
      hclOrId = new HCL(this.appId, hclOrId);
    }
    return this._dvmMap[hclOrId.toString()];
  }


  /** */
  getClones(baseRoleName: BaseRoleName): DnaViewModel[] {
    const searchHcl = new HCL(this.appId, baseRoleName);
    let clones = [];
    //console.log("getClones()", baseRoleName, this._dvmMap);
    for (const [sHcl, dvm] of Object.entries(this._dvmMap)) {
      const hcl = HCL.parse(sHcl);
      if (hcl.isClone() && hcl.match(searchHcl)) {
        clones.push(dvm);
      }
    }
    return clones;
  }


  /** -- Create -- */

  /** Spawn a HappViewModel for an AppId running on the ConductorAppProxy */
  static async new(host: ReactiveElement, conductorAppProxy: ConductorAppProxy, hvmDef: HvmDef): Promise<HappViewModel> {
    //console.log("HappViewModel.new()", hvmDef.id)
    /** Create all Cell Proxies in the definition */
    for (const dvmDef of hvmDef.dvmDefs) {
      if (dvmDef.ctor.DEFAULT_BASE_ROLE_NAME === undefined) {
        Promise.reject("static field DEFAULT_BASE_ROLE_NAME not defined for class " + dvmDef.ctor.name);
      }
      const baseRoleName = dvmDef.baseRoleName
        ? dvmDef.baseRoleName
        : dvmDef.ctor.DEFAULT_BASE_ROLE_NAME;
      await conductorAppProxy.fetchCells(hvmDef.id, baseRoleName);
      const hcl = new HCL(hvmDef.id, baseRoleName);
      conductorAppProxy.createCellProxy(hcl);
    }
    const hvm = new HappViewModel(host, conductorAppProxy, hvmDef);
    await hvm.initialProbe();
    return hvm;
  }


  /** Ctor */
  private constructor(
    protected _host: ReactiveElement, /* VIEW */
    protected _conductorAppProxy: ConductorAppProxy, /* MODEL */
    hvmDef: HvmDef, /* VIEW-MODEL definition */
    ) {
    this.appId = hvmDef.id;
    /** Create all non-deferred DVMs for this Happ */
    for (const dvmDef of hvmDef.dvmDefs) {
      this.createOriginalDvm(dvmDef);
    }
    this.createStartingClonesDvm();
    //console.log("HappViewModel created", this._dvmMap)
  }


  /** -- Methods -- */

  /** */
  private createStartingClonesDvm(): void {
    const appInstalledCells: CellsMap = this._conductorAppProxy.getAppCells(this.appId)!;
    for (const [baseRoleName, roleCells] of Object.entries(appInstalledCells)) {
      const def = this._defMap[baseRoleName];
      for (const name_or_index of Object.keys(roleCells.clones)) {
        const cloneIndex: CloneIndex = Number(name_or_index); // TODO: Change this when supporting cloneNames
        const hcl = new HCL(this.appId, baseRoleName, cloneIndex);
        this._conductorAppProxy.createCellProxy(hcl);
        this.createDvm(def, hcl);
      }
    }
  }


  /** */
  private createDvm(dvmDef: DvmDef, hcl: HCL): DnaViewModel {
    const dvm: DnaViewModel = new dvmDef.ctor(this._host, this._conductorAppProxy, hcl); // WARN this can throw an error
    //console.log(`  createDvm() for "${hcl.toString()}" ; cellId: ${CellIdStr(dvm.cellId)}`);
    /** Setup signalHandler */
    if (dvm.signalHandler) {
      //console.log(`"${dvm.baseRoleName}" signalHandler added`, dvm.signalHandler);
      try {
        this._conductorAppProxy.addSignalHandler((sig: AppSignal) => {
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
    const hcl = new HCL(this.appId, baseRoleName as RoleInstanceId);
    this.createDvm(dvmDef, hcl);
    this._defMap[baseRoleName] = dvmDef;
  }


  /** */
  async cloneDvm(baseRoleName: BaseRoleName, cellDef?: CellDef): Promise<[number, DnaViewModel]> {
    //console.log("createCloneDvm()", baseRoleName);
    /** Check preconditions */
    const def = this._defMap[baseRoleName];
    if (!def) {
      Promise.reject(`createCloneDvm() failed for ${baseRoleName}. No original DVM created.`)
    }
    if (!def.isClonable) {
      Promise.reject(`createCloneDvm() failed. Role "${baseRoleName}" is not clonable.`)
    }
    /** Get cloneIndex */
    const clones = this.getClones(baseRoleName);
    const cloneIndex: CloneIndex = clones.length;
    let hcl = new HCL(this.appId, baseRoleName, cloneIndex);
    /** Build default request */
    let request: CreateCloneCellRequest = {
      app_id: this.appId,
      role_name: baseRoleName,
      modifiers: {
        network_seed: String(cloneIndex),
      },
    }
    /** Modify hcl & request according to CellDef */
    if (cellDef) {
      request.modifiers = cellDef.modifiers;
      request.membrane_proof = cellDef.membraneProof;
      request.name = cellDef.cloneName;
      if (cellDef.cloneName) {
        hcl = new HCL(this.appId, baseRoleName, cloneIndex, cellDef.cloneName);
      }
    }
    /** Create Cell */
    const cloneInstalledCell = await this._conductorAppProxy.createCloneCell(request);
    //console.log("clone created:", CellIdStr(cloneInstalledCell.cell_id));
    const cloneCell = await this._conductorAppProxy.fetchCell(this.appId, cloneInstalledCell.cell_id);
    console.log("clone created:", cloneCell);

    // const cloneCell: Cell = {
    //   cell_id: cloneInstalledCell.cell_id,
    //   //clone_id?: RoleName;
    //   dna_modifiers: request.modifiers,
    //   name: cellDef && cellDef.cloneName? cellDef.cloneName : "noname",
    //   enabled: true,
    // };

    /** Get created cell */
    this._conductorAppProxy.addClone(hcl, cloneCell);
    /** Create CellProxy */
    this._conductorAppProxy.createCellProxy(hcl);
    /** Create DVM */
    const dvm = this.createDvm(def, hcl);
    return [cloneIndex, dvm];
  }


  /** */
  async probeAll(): Promise<void> {
    for (const dvm of Object.values(this._dvmMap)) {
      await dvm.probeAll();
    }
  }

  /** */
  private async initialProbe(): Promise<void> {
    for (const dvm of Object.values(this._dvmMap)) {
      await dvm.initialProbe();
    }
  }


  /** */
  dumpLogs(roleInstanceId?: RoleInstanceId): void {
    if (roleInstanceId) {
      const dvm = this.getDvm(roleInstanceId);
      if (dvm) {
        dvm.dumpLogs();
      } else {
        console.error(`dumpLogs() failed. Role "${roleInstanceId}" not found in happ "${this.appId}"`)
      }
    } else {
      for (const dvm of Object.values(this._dvmMap)) {
        dvm.dumpLogs();
      }
    }
  }
 }
