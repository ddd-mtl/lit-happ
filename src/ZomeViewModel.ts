import {createContext} from "@lit-labs/context";
import { ZomeProxy } from "./ZomeProxy";
import {IViewModel, ViewModel} from "./ViewModel";
import { CellProxy } from "./CellProxy";
import {ICellDef} from "./CellDef";
import {CellId, InstalledCell, RoleId} from "@holochain/client";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";

export type ZvmClass = {new(proxy: CellProxy): IZomeViewModel}

export type IZomeViewModel = _ZomeViewModel & ICellDef & IViewModel;


/** Interface for the generic-less ZomeViewModel class */
export interface _ZomeViewModel {
    get zomeName(): string;
}


/**
 * Abstract ViewModel for a Zome.
 * It extends a ViewModel by adding a ZomeProxy.
 * Views are required to use this in order to interact with the ZomeProxy.
 * The perspective is the data from the Zome that is transformed and enhanced in order to be consumed by a View.
 * It can be automatically updated by Signals or the Zome Scheduler.
 */
export abstract class ZomeViewModel<P, T extends ZomeProxy> extends ViewModel<P> implements IZomeViewModel {
    protected constructor(protected _zomeProxy: T) {
        super();
    }

    get zomeName(): string { return this._zomeProxy.zomeName }

    /** CellDef interface */
    get cellDef(): InstalledCell { return this._zomeProxy.cellDef }
    get roleId(): RoleId { return this._zomeProxy.roleId }
    get cellId(): CellId { return this._zomeProxy.cellId }
    get dnaHash(): EntryHashB64 { return this._zomeProxy.dnaHash}
    get agentPubKey(): AgentPubKeyB64 { return this._zomeProxy.agentPubKey }

    /** */
    getContext(): any {
        const context = createContext<typeof this>('zvm/'+ this.zomeName +'/' + this.dnaHash)
        //console.log({contextType: typeof context})
        return context
    }
}

