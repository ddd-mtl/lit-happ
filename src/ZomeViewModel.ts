import {createContext} from "@lit-labs/context";
import {ZomeProxy} from "./ZomeProxy";
import {IViewModel, ViewModel} from "./ViewModel";
import { CellProxy } from "./CellProxy";
import {ICellDef, IZomeSpecific, ZomeSpecificMixin} from "./CellDef";
import {CellId, InstalledCell, RoleId} from "@holochain/client";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";


export type ZvmClass = {new(proxy: CellProxy): IZomeViewModel}

/** Interface for the generic-less ZomeViewModel class */
export type IZomeViewModel = ICellDef & IViewModel & IZomeSpecific;

/**
 * Abstract ViewModel for a Zome.
 * It extends a ViewModel by adding a ZomeProxy.
 * Views are required to use this in order to interact with the ZomeProxy.
 * The perspective is the data from the Zome that is transformed and enhanced in order to be consumed by a View.
 * It can be automatically updated by Signals or the Zome Scheduler.
 */
export abstract class ZomeViewModel extends ZomeSpecificMixin(ViewModel) implements IZomeViewModel {
    protected constructor(protected _baseZomeProxy: ZomeProxy) {
        super();
        this.setZomeName(this._baseZomeProxy.zomeName);
    }

    abstract get zomeProxy(): ZomeProxy;

    /** CellDef interface */
    get cellDef(): InstalledCell { return this._baseZomeProxy.cellDef }
    get roleId(): RoleId { return this._baseZomeProxy.roleId }
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

