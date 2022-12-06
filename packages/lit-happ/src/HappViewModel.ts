import {Dictionary} from "@holochain-open-dev/core-types";
import {CreateCloneCellRequest, InstalledAppId, InstalledCell} from "@holochain/client";
import { ReactiveElement } from "lit";
import {
  BaseRoleName, CellIdStr, CellLocation,
  CloneIndex,
  ConductorAppProxy,
  destructureRoleInstanceId, InstalledCellsMap,
  RoleInstanceId
} from "@ddd-qc/cell-proxy";
import {CellDef, DvmDef, HvmDef} from "./definitions";
import {DnaViewModel} from "./DnaViewModel";
import {AppSignal} from "@holochain/client/lib/api/app/types";
import {CellId} from "@holochain/client/lib/types";


//export type HvmConstructor = {new(installedAppId: InstalledAppId): HappViewModel};


export type RoleDvms = {
  def: DvmDef,
  original: CellId,
  /** CloneName / Index -> CellId */
  clones: Dictionary<CellId>,
}


/**
 * "ViewModel" of a hApp
 * Creates and stores all the DnaViewModels from the happDef.
 */
 export class HappViewModel {

  /** -- Fields -- */
  readonly installedAppId: InstalledAppId;
  /** CellIdStr -> DnaViewModel */
  protected _dvmMap: Dictionary<DnaViewModel[]> = {};
  /** BaseRoleName -> DvmDef */
  protected _defMap: Dictionary<DvmDef> = {};


  /** -- Getters -- */

  /** */
  getDef(name: BaseRoleName): DvmDef | undefined {
    return this._defMap[name];
  }


  /** */
  getCellDvms(cellId: CellId): DnaViewModel[] | undefined {
    return this._dvmMap[CellIdStr(cellId)];
  }

  /** */
  getDvm(id: RoleInstanceId): DnaViewModel | undefined {
    const cellLoc = new CellLocation(this.installedAppId, id);
    const maybeCell = this._conductorAppProxy.getInstalledCellByLocation(cellLoc);
    if (!maybeCell) return undefined;
    const dvms = this.getCellDvms(maybeCell.cell_id);
    if (!dvms) return undefined;
    for (const dvm of dvms) {
      if (dvm.roleInstanceId == id) {
        return dvm;
      }
    }
    return undefined;
  }

  /** */
  getClones(baseRoleName: BaseRoleName): DnaViewModel[] {
    const cloneIds: InstalledCell[] = this._conductorAppProxy.getClones(this.installedAppId, baseRoleName);
    let clones = []
    for (const installedCell of cloneIds) {
      const maybeDvms = this.getCellDvms(installedCell.cell_id)
      if (!maybeDvms) {
        console.warn("DVM not found for", CellIdStr(installedCell.cell_id), baseRoleName);
        continue;
      }
      for (const dvm of maybeDvms) {
        const maybePair = destructureRoleInstanceId(dvm.roleInstanceId)
        const curBaseName = maybePair? maybePair[0] : dvm.roleInstanceId;
        if (curBaseName == baseRoleName) {
          clones.push(dvm);
        }
      }
    }
    return clones;
  }


  /** -- Create -- */

  /** Spawn a HappViewModel for an AppId running on the ConductorAppProxy */
  static async new(host: ReactiveElement, conductorAppProxy: ConductorAppProxy, hvmDef: HvmDef): Promise<HappViewModel> {
    console.log("HappViewModel.new()", hvmDef.id)
    /** Create all Cell Proxies in the definition */
    for (const dvmDef of hvmDef.dvmDefs) {
      const baseRoleName = dvmDef.baseRoleName
        ? dvmDef.baseRoleName
        : dvmDef.ctor.DEFAULT_BASE_ROLE_NAME;
      await conductorAppProxy.createRoleInstalledCells(hvmDef.id, baseRoleName);
      conductorAppProxy.createCellProxy(hvmDef.id, baseRoleName);
    }
    return new HappViewModel(host, conductorAppProxy, hvmDef);
  }


  /** Ctor */
  private constructor(
    protected _host: ReactiveElement, /* VIEW */
    protected _conductorAppProxy: ConductorAppProxy, /* MODEL */
    hvmDef: HvmDef, /* VIEW-MODEL */
    ) {
    this.installedAppId = hvmDef.id;
    /** Create all non-deferred DVMs for this Happ */
    for (const dvmDef of hvmDef.dvmDefs) {
      // let baseRoleName = dvmDef.baseRoleName
      //   ? dvmDef.baseRoleName
      //   : dvmDef.ctor.DEFAULT_BASE_ROLE_NAME;
      this.createOriginalDvm(dvmDef);
    }
    this.createStartingClonesDvm();
    console.log("HappViewModel created", this._dvmMap)
  }


  /** -- Methods -- */

  private createStartingClonesDvm(): void {
    const appInstalledCells: InstalledCellsMap = this._conductorAppProxy.getAppCells(this.installedAppId)!;
    for (const [baseRoleName, roleInstalledCells] of Object.entries(appInstalledCells)) {
      const def = this._defMap[baseRoleName];
      for (const name_or_index of Object.keys(roleInstalledCells.clones)) {
        const cloneIndex: CloneIndex = Number(name_or_index); // TODO: Change this when supporting cloneNames
        this._conductorAppProxy.createCellProxy(this.installedAppId, baseRoleName, cloneIndex);
        this.createDvm(def, baseRoleName, cloneIndex);
      }
    }
  }


  /** */
  private createDvm(dvmDef: DvmDef, baseRoleName: BaseRoleName, cloneIndex?: CloneIndex, cellDef?: CellDef,  cloneName?: string): DnaViewModel {
    let dvm: DnaViewModel = new dvmDef.ctor(this._host, this.installedAppId, this._conductorAppProxy, baseRoleName, cloneIndex); // WARN this can throw an error
    const cellIdStr = CellIdStr(dvm.cellId);
    const cellLoc = CellLocation.from(this.installedAppId, baseRoleName, cloneIndex);
    console.log(`  createDvm() for "${cellLoc.asHcl()}" ; cellId: ${cellIdStr}`);
    /** Setup signalHandler */
    if (dvm.signalHandler) {
      //console.log(`"${dvm.baseRoleName}" signalHandler added`, dvm.signalHandler);
      //conductorAppProxy.addSignalHandler(dvm.signalHandler});
      try {
        this._conductorAppProxy.addSignalHandler((sig: AppSignal) => {
          dvm.signalHandler!(sig)
        }, cellLoc.asHcl());
      } catch (e) {
        console.error(e)
      }
    }
    /** Store and index it */
    if (!this._dvmMap[cellIdStr]) {
      this._dvmMap[cellIdStr] = []
    }
    this._dvmMap[cellIdStr].push(dvm);
    /** Done */
    return dvm;
  }


  /** */
  private createOriginalDvm(dvmDef: DvmDef, cellDef?: CellDef): void {
    /** Determine params */
    const baseRoleName = dvmDef.baseRoleName
      ? dvmDef.baseRoleName
      : dvmDef.ctor.DEFAULT_BASE_ROLE_NAME;
    console.log("createOriginalDvm() for ", baseRoleName);
    if (this._dvmMap[baseRoleName]) {
      Promise.reject(`createOriginalDvm() failed. DVM for original cell of ${baseRoleName} already exists.`);
    }
    this.createDvm(dvmDef, baseRoleName/*, cellDef*/);
    this._defMap[baseRoleName] = dvmDef;
  }



  /** */
  async cloneDvm(baseRoleName: BaseRoleName, cellDef?: CellDef): Promise<[number, DnaViewModel]> {
    console.log("createCloneDvm()", baseRoleName);
    /** Check preconditions */
    const def = this._defMap[baseRoleName];
    if (!def) {
      Promise.reject(`createCloneDvm() failed for ${baseRoleName}. No original DVM created.`)
    }
    if (!def.isClonable) {
      Promise.reject(`createCloneDvm() failed. Role "${baseRoleName}" is not clonable.`)
    }
    /** */
    //await this._conductorAppProxy.createRoleInstalledCells(this.installedAppId, baseRoleName);
    const clones = this.getClones(baseRoleName);
    const cloneIndex: CloneIndex = clones.length;
    let cloneName = "" + cloneIndex;
    /** Create Cell if it's a clone */
    let request: CreateCloneCellRequest = {
      app_id: this.installedAppId,
      role_id: baseRoleName,
      modifiers: {
        network_seed: "" + cloneIndex,
      },
    }
    if (cellDef) {
      request.modifiers = cellDef.modifiers;
      request.membrane_proof = cellDef.membraneProof;
      request.name = cellDef.cloneName;
      if (cellDef.cloneName) {
        cloneName = cellDef.cloneName;
      }
    }
    /** Create Cell */
    const cloneInstalledCell = await this._conductorAppProxy.createCloneCell(request);
    console.log("cloneInstalledCell", CellIdStr(cloneInstalledCell.cell_id));
    /** Get created cell */
    const cellLoc = CellLocation.from(this.installedAppId, baseRoleName, cloneIndex);
    this._conductorAppProxy.addCloneInstalledCell(cellLoc, cloneInstalledCell);
    //await this._conductorAppProxy.createRoleInstalledCells(this.installedAppId, baseRoleName);
    /** Create CellProxy */
    this._conductorAppProxy.createCellProxy(this.installedAppId, baseRoleName, cloneIndex);
    /** Create DVM */
    console.log({dvmMapBefore: this._dvmMap})
    const dvm = this.createDvm(def, baseRoleName, cloneIndex, cellDef, cloneName);
    console.log({dvmMapAfter: this._dvmMap})
    return [cloneIndex, dvm];
  }


  /** */
  async probeAll(): Promise<void> {
    for (const dvms of Object.values(this._dvmMap)) {
      if (dvms.length <= 0) continue;
      await dvms[0].probeAll();
    }
  }


  /** */
  dumpLogs(roleInstanceId?: RoleInstanceId): void {
    if (roleInstanceId) {
      const dvm = this.getDvm(roleInstanceId);
      if (dvm) {
        dvm.dumpLogs();
      } else {
        console.error(`dumpLogs() failed. Role "${roleInstanceId}" not found in happ "${this.installedAppId}"`)
      }
    } else {
      for (const dvms of Object.values(this._dvmMap)) {
        if (dvms.length <= 0) continue;
        dvms[0].dumpLogs();
      }
    }
  }
 }
