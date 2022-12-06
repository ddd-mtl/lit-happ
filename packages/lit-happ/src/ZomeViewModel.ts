import {createContext} from "@lit-labs/context";
import {CellProxy, ZomeProxy, ZomeProxyConstructor, IInstalledCell, RoleInstanceId} from "@ddd-qc/cell-proxy";
import {ViewModel} from "./ViewModel";
import {CellId, InstalledCell, ZomeName} from "@holochain/client";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";


export type ZvmConstructor = {new(proxy: CellProxy, zomeName?: ZomeName): ZomeViewModel} /*& typeof ZomeSpecific;*/

/** (EXPERIMENTAL) Class Decorator */
export function zvm(zProxyCtor: typeof ZomeProxy) {
    return (ctor: Function) => {
        //let zvmCtor = (ctor as typeof ZomeViewModel);
        (ctor as any).ZOME_PROXY = zProxyCtor;
        //get zomeProxy(): DummyZomeProxy {return this._zomeProxy as DummyZomeProxy;}
        //(ctor as any).zomeProxy = function() {return (ctor as any)._zomeProxy as typeof zProxyFactory;}
        //(ctor as any).zomeProxy = (ctor as any)._zomeProxy as typeof zProxyFactory;
    }
}


/**
 * Abstract ViewModel for a Zome.
 * It extends a ViewModel by adding a ZomeProxy.
 * Views are required to use this in order to interact with the ZomeProxy.
 * The perspective is the data from the Zome that is transformed and enhanced in order to be consumed by a View.
 * It can be automatically updated by Signals or the Zome Scheduler.
 */
export abstract class ZomeViewModel extends ViewModel implements IInstalledCell {

    /** Zome proxy constructor */
    static ZOME_PROXY: ZomeProxyConstructor;
    protected _zomeProxy: ZomeProxy;
    /* Child class should implement with child proxy class as return type */
    abstract get zomeProxy(): ZomeProxy;
    getProxyConstructor(): ZomeProxyConstructor {
        return (this.constructor as typeof ZomeViewModel).ZOME_PROXY;
    }


    /** Zome name */
    static get DEFAULT_ZOME_NAME(): string {
        return this.ZOME_PROXY.DEFAULT_ZOME_NAME;
    }
    zomeName!: ZomeName;


    /** Ctor */
    constructor(cellProxy: CellProxy, zomeName?: ZomeName) {
        super();
        const zProxyCtor = this.getProxyConstructor();
        if (!zProxyCtor) {
            throw Error("ZOME_PROXY static field undefined in ZVM subclass " + this.constructor.name);
        }
        if (zomeName) {
            this.zomeName = zomeName;
            this._zomeProxy = new zProxyCtor(cellProxy, this.zomeName);
        } else {
            this._zomeProxy = new zProxyCtor(cellProxy);
            this.zomeName = this._zomeProxy.getDefaultZomeName();
        }
    }


    /** InstalledCell interface */
    get installedCell(): InstalledCell { return this._zomeProxy.installedCell }
    get roleInstanceId(): RoleInstanceId { return this._zomeProxy.roleInstanceId }
    get cellId(): CellId { return this._zomeProxy.cellId }
    get dnaHash(): EntryHashB64 { return this._zomeProxy.dnaHash}
    get agentPubKey(): AgentPubKeyB64 { return this._zomeProxy.agentPubKey }

    /** */
    getContext(): any {
        const defaultZomeName = this._zomeProxy.getDefaultZomeName();
        const context = createContext<typeof this>('zvm/'+ defaultZomeName +'/' + this.dnaHash)
        //console.log({contextType: typeof context})
        return context
    }
}

