import {createContext} from "@lit-labs/context";
import {ZomeProxy} from "./ZomeProxy";
import {IViewModel, ViewModel} from "./ViewModel";
import { CellProxy } from "./CellProxy";
import {ICellDef} from "./CellDef";
import {CellId, InstalledCell, RoleId, ZomeName} from "@holochain/client";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import { IZomeSpecific, RoleSpecificMixin, ZomeSpecificMixin } from "./mixins";


/** Interfaces that ZomeViewModel must implement */
export type IZomeViewModel = ICellDef & IViewModel & IZomeSpecific;

export type ZvmClass = {new(proxy: CellProxy, zomeName?: ZomeName): IZomeViewModel}

export type ZvmDef = ZvmClass | [ZvmClass, ZomeName]; // optional ZomeName override

/**
 * Abstract ViewModel for a Zome.
 * It extends a ViewModel by adding a ZomeProxy.
 * Views are required to use this in order to interact with the ZomeProxy.
 * The perspective is the data from the Zome that is transformed and enhanced in order to be consumed by a View.
 * It can be automatically updated by Signals or the Zome Scheduler.
 */
export abstract class ZomeViewModel extends RoleSpecificMixin(ZomeSpecificMixin(ViewModel)) implements IZomeViewModel {
    protected constructor(protected _baseZomeProxy: ZomeProxy, zomeName?: ZomeName) {
        super();
        if (zomeName) {
            this.zomeName = zomeName;
        }
        this.roleId = this._baseZomeProxy.roleId;
    }

    abstract get zomeProxy(): ZomeProxy;

    /** CellDef interface */
    get installedCell(): InstalledCell { return this._baseZomeProxy.installedCell }
    //get roleId(): RoleId { return this._baseZomeProxy.roleId }
    get cellId(): CellId { return this._baseZomeProxy.cellId }
    get dnaHash(): EntryHashB64 { return this._baseZomeProxy.dnaHash}
    get agentPubKey(): AgentPubKeyB64 { return this._baseZomeProxy.agentPubKey }

    /** */
    getContext(): any {
        const context = createContext<typeof this>('zvm/'+ this.zomeName +'/' + this.dnaHash)
        //console.log({contextType: typeof context})
        return context
    }
}

