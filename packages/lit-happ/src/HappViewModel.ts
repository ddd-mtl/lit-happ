import {Dictionary} from "@holochain-open-dev/core-types";
import {Create, CreateCloneCellRequest, InstalledAppId, InstalledCell, RoleId} from "@holochain/client";
import { ReactiveElement } from "lit";
import {CellIndex, ConductorAppProxy} from "@ddd-qc/cell-proxy";
import {CellDef, DvmDef, HvmDef} from "./definitions";
import {DnaViewModel} from "./DnaViewModel";
import {AppSignal} from "@holochain/client/lib/api/app/types";


//export type HvmConstructor = {new(installedAppId: InstalledAppId): HappViewModel};


/**
 * "ViewModel" of a hApp
 * Creates and stores all the DnaViewModels from the happDef.
 */
 export class HappViewModel {

  /** -- Fields -- */
  /** RoleName -> [DVM] */
  protected _dvmMap: Dictionary<DnaViewModel[]> = {};
  readonly installedAppId: InstalledAppId;

  /** -- Getters -- */

  getDvms(roleName: RoleId): DnaViewModel[] {
    return this._dvmMap[roleName];
  }

  /** */
  getDvm(roleName: RoleId, name_or_index?: string | number): DnaViewModel | undefined {
    const dvms = this._dvmMap[roleName];
    if (!dvms) {
      return undefined;
    }
    if (!name_or_index) {
      return this._dvmMap[roleName][0];
    }
    if (typeof name_or_index == 'string') {
      const name = name_or_index as string;
      for (const dvm of dvms) {
        if (dvm.cloneName && dvm.cloneName == name) {
          return dvm;
        }
      }
      return undefined;
    }
    const index = name_or_index as number;
    if (dvms.length <= index) return undefined;
    return dvms[index];
  }


  /** -- Create -- */

  /** Spawn a HappViewModel for an AppId running on the ConductorAppProxy */
  static async new(host: ReactiveElement, conductorAppProxy: ConductorAppProxy, hvmDef: HvmDef): Promise<HappViewModel> {
    /** Create all Cell Proxies in the definition */
    for (const dvmDef of hvmDef.dvmDefs) {
      if (dvmDef.isClonable) {
        continue
      }
      let roleId = dvmDef.roleId
        ? dvmDef.roleId
        : dvmDef.ctor.DEFAULT_ROLE_ID;
      await conductorAppProxy.createCellProxy(hvmDef.id, roleId);
    }
    return new HappViewModel(host, conductorAppProxy, hvmDef);
  }


  /** */
  private constructor(
    protected _host: ReactiveElement, /* VIEW */
    protected _conductorAppProxy: ConductorAppProxy, /* MODEL */
    _hvmDef: HvmDef, /* VIEW-MODEL */
    ) {
    this.installedAppId = _hvmDef.id;
    /** Create all non-deferred DVMs for this Happ */
    for (const dvmDef of _hvmDef.dvmDefs) {
      let roleId = dvmDef.roleId
        ? dvmDef.roleId
        : dvmDef.ctor.DEFAULT_ROLE_ID;
      this._dvmMap[roleId] = [];
      if (dvmDef.isClonable) {
        continue;
      }
      this.createDvm(dvmDef);
    }
    console.log({dvmMap: this._dvmMap});
  }


  /** -- Methods -- */

  /** */
  async addCloneDvm(dvmDef: DvmDef, cellDef?: CellDef): Promise<[number, DnaViewModel]> {
    if (!dvmDef.isClonable) {
      Promise.reject(("DVM not clonable:" + dvmDef.ctor.DEFAULT_ROLE_ID));
    }
    /** Determine params */
    const roleId = dvmDef.roleId
      ? dvmDef.roleId
      : dvmDef.ctor.DEFAULT_ROLE_ID;
    const index = this._dvmMap[roleId].length;
    let cloneName = "" + index;

    /** Create Cell if it's a clone */
    let request: CreateCloneCellRequest = {
      app_id: this.installedAppId,
      role_id: roleId,
      modifiers: {
        //network_seed: "" + index,
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
    await this._conductorAppProxy.createCloneCell(request);

    /** Create CellProxy First */
    await this._conductorAppProxy.createCellProxy(this.installedAppId, roleId, index);
    /** Create DVM */
    const res = await this.createDvm(dvmDef, cellDef, cloneName);
    console.log({dvmMap: this._dvmMap})
    return res;
  }


  /** */
  private async createDvm(dvmDef: DvmDef, cellDef?: CellDef, cloneName?: string): Promise<[number, DnaViewModel]> {
    /** Determine params */
    const roleId = dvmDef.roleId
      ? dvmDef.roleId
      : dvmDef.ctor.DEFAULT_ROLE_ID;
    const index = this._dvmMap[roleId].length;
    let dvm: DnaViewModel = new dvmDef.ctor(this._host, this.installedAppId, this._conductorAppProxy, dvmDef.roleId, index); // WARN this can throw an error
    dvm.cloneName = cloneName;
    /** Setup signalHandler */
    if (dvm.signalHandler) {
      //console.log(`"${dvm.roleId}" signalHandler added`, dvm.signalHandler);
      //conductorAppProxy.addSignalHandler(dvm.signalHandler});
      try {
        this._conductorAppProxy.addSignalHandler((sig: AppSignal) => {
          dvm.signalHandler!(sig)
        }, dvm.cellId);
      } catch (e) {
        console.error(e)
      }
    }
    /** Add dvm to map */
    this._dvmMap[dvm.roleId].push(dvm);
    return [index, dvm];
  }


  /** */
  async probeAll(): Promise<void> {
   for (const dvms of Object.values(this._dvmMap)) {
    //console.log("Hvm.probeAll() dvm =", dvm.roleId)
     for (const dvm of dvms) {
       await dvm.probeAll();
     }
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
      for (const dvms of Object.values(this._dvmMap)) {
        for (const dvm of dvms) {
          dvm.dumpLogs();
        }
      }
    }
  }
 }
