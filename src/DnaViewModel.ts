import {CellProxy} from "./CellProxy";
import {IZomeViewModel, ZvmClass} from "./ZomeViewModel";
import {ReactiveElement} from "lit";
import {AgentPubKeyB64, Dictionary, EntryHashB64} from "@holochain-open-dev/core-types";
import {IViewModel, ViewModel} from "./ViewModel";
import { HappViewModel } from "./HappViewModel";
import {CellId, InstalledCell, RoleId} from "@holochain/client";
import {ICellDef, RoleSpecificMixin} from "./CellDef";
import {createContext} from "@lit-labs/context";


export type DvmClass = {new(happ: HappViewModel, roleId: string): IDnaViewModel}


export type IDnaViewModel = _DnaViewModel & ICellDef & IViewModel;

/** Interface for the generic-less DnaViewModel class */
interface _DnaViewModel {
  fetchAllEntryDefs(): Promise<Dictionary<[string, boolean][]>>;
  //get entryTypes(): Dictionary<[string, boolean][]>;
  dumpLogs(zomeName?: string): void;
}


/**
 * Abstract ViewModel for a DNA.
 * It holds the CellProxy and all the ZomeViewModels of the DNA.
 * A DNA is expected to derive this class and add extra logic at the DNA level.
 */
export abstract class DnaViewModel extends RoleSpecificMixin(ViewModel) implements IDnaViewModel {

  /** Ctor */
  protected constructor(happ: HappViewModel, roleId: RoleId, zvmClasses: ZvmClass[]) {
    super();
    this._cellProxy = happ.conductorAppProxy.newCellProxy(happ.appInfo, roleId); // FIXME can throw error
    this.setRoleId(this._cellProxy.roleId);
    /** Create all ZVMs for this DNA */
    for (const zvmClass of zvmClasses) {
      const zvm = new zvmClass(this._cellProxy);
      this._zomeViewModels[zvm.zomeName] = zvm;
    }
    this.provideContext(happ.host);
  }


  /** -- Fields -- */
  protected _cellProxy: CellProxy;
  protected _zomeViewModels: Dictionary<IZomeViewModel> = {};
  private _allEntryDefs: Dictionary<[string, boolean][]> = {};


  /** CellDef interface */
  get cellDef(): InstalledCell {return this._cellProxy.cellDef}
  //get roleId(): RoleId { return this._cellProxy.roleId } // Already defined in RoleSpecificMixin
  get cellId(): CellId { return this._cellProxy.cellId }
  get dnaHash(): EntryHashB64 { return this._cellProxy.dnaHash}
  get agentPubKey(): AgentPubKeyB64 { return this._cellProxy.agentPubKey }


  /** -- Getters -- */

  getEntryDefs(zomeName: string): [string, boolean][] | undefined {return this._allEntryDefs[zomeName]}
  getZomeViewModel(zomeName: string): IZomeViewModel | undefined {return this._zomeViewModels[zomeName]}


  /** -- Methods -- */

  /** Override so we can provide context of all zvms */
  /*private*/ provideContext(host: ReactiveElement): void {
    //console.log("DVM.provideContext()", host, this)
    super.provideContext(host);
    for (const zvm of Object.values(this._zomeViewModels)) {
      zvm.provideContext(host)
    }
  }


  getContext():any {return createContext<typeof this>('dvm/' + this.roleId)};


  /** */
  async probeAll(): Promise<void> {
    for (const [name, zvm] of Object.entries(this._zomeViewModels)) {
      //console.log("Dvm.probeAll()", name)
      await zvm.probeAll();
    }
  }


  /** Useless since the entry defs are in the integrity zome which is not represented here */
  async fetchAllEntryDefs(): Promise< Dictionary<[string, boolean][]>> {
    for (const zvm of Object.values(this._zomeViewModels)) {
      this._allEntryDefs[(zvm.constructor as any).zomeName] = await this._cellProxy.callEntryDefs((zvm.constructor as any).zomeName); // TODO optimize
    }
    return this._allEntryDefs;
  }



  /** */
  dumpLogs(zomeName?: string): void {
    this._cellProxy.dumpLogs(zomeName)
  }
}
