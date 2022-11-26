import {createContext} from "@lit-labs/context";
import {ZomeProxy, ZomeProxyClass} from "./ZomeProxy";
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
export abstract class ZomeViewModel extends ZomeSpecificMixin(ViewModel) implements IZomeViewModel {
    
    /** Ctor */
    constructor(cellProxy: CellProxy, zomeName?: ZomeName) {
        super();
        if (zomeName) {
            this.zomeName = zomeName;
        }
        const zProxyClass = (this.constructor as any).PROXY_TYPE;
        this._zomeProxy = new zProxyClass(cellProxy, this.zomeName);
    }

    protected _zomeProxy: ZomeProxy;

    abstract get zomeProxy(): ZomeProxy; // Child class should implement with child proxy class as return type

    /** CellDef interface */
    get installedCell(): InstalledCell { return this._zomeProxy.installedCell }
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

