import {Context, createContext} from "@lit/context";
import {
    CellProxy,
    ZomeProxy,
    ZomeProxyConstructor,
    CellMixin,
    SignalLog,
    prettySignalLogs,
    Cell,
    AbstractConstructor,
    AgentId,
    dec64,
    TipProtocol,
    ZomeSignalProtocol,
    TipProtocolVariantEntry,
    ZomeSignalProtocolVariantEntry,
    TipProtocolVariantLink,
    ZomeSignalProtocolVariantLink,
    TipProtocolVariantApp, prettyDate, ZomeSignal, ZomeSignalProtocolType, EntryPulse, LinkPulse, ActionId, EntryId
} from "@ddd-qc/cell-proxy";
import {ViewModel} from "./ViewModel";
import {AgentPubKeyB64, AppSignalCb, Timestamp, ZomeName} from "@holochain/client";
import {AppSignal} from "@holochain/client/lib/api/app/types";
import {DnaViewModel} from "./DnaViewModel";

export type ZvmConstructor = {new(proxy: CellProxy, dvmParent: DnaViewModel, zomeName?: ZomeName): ZomeViewModel} /*& typeof ZomeSpecific;*/

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
export abstract class ZomeViewModel extends CellMixin(ViewModel) {

    /** Zome proxy constructor */
    static ZOME_PROXY: ZomeProxyConstructor;
    protected _zomeProxy: ZomeProxy;
    /* Child class should implement with child proxy class as return type */
    abstract get zomeProxy(): ZomeProxy;
    getProxyConstructor(): ZomeProxyConstructor {
        return (this.constructor as typeof ZomeViewModel).ZOME_PROXY;
    }



    signalHandler?: AppSignalCb;

    /** Zome name */
    static get DEFAULT_ZOME_NAME(): string {
        return this.ZOME_PROXY.DEFAULT_ZOME_NAME;
    }
    zomeName!: ZomeName;

    static get ENTRY_TYPES(): string[] {
        return this.ZOME_PROXY.ENTRY_TYPES;
    }
    static get LINK_TYPES(): string[] {
        return this.ZOME_PROXY.LINK_TYPES;
    }

    protected _dvmParent: DnaViewModel;


    /** Ctor */
    constructor(cellProxy: CellProxy, dvmParent: DnaViewModel, zomeName?: ZomeName) {
        super();
        this._dvmParent = dvmParent;
        const zProxyCtor = this.getProxyConstructor();
        if (!zProxyCtor) {
            throw Error("ZOME_PROXY static field undefined in ZVM subclass " + this.constructor.name);
        }
        if (zomeName) {
            this.zomeName = zomeName;
            this._zomeProxy = new zProxyCtor(cellProxy, this.zomeName);
        } else {
            this._zomeProxy = new zProxyCtor(cellProxy);
            this.zomeName = this._zomeProxy.defaultZomeName;
        }
        this._cell = cellProxy.cell;
        cellProxy.addSignalHandler( (signal: AppSignal) => this.handleZomeSignal(signal));
    }


    /** Notify DVM parent */
    protected notifySubscribers(): boolean {
        const hasChanged = super.notifySubscribers();
        if (hasChanged) {
            this._dvmParent.zvmChanged(this);
        }
        return hasChanged;
    }

    /** Filter signal by zome name */
    private handleZomeSignal(signal: AppSignal) {
        //console.log("handleZomeSignal()", this.signalHandler, this.zomeName, signal.zome_name)
        if (this.signalHandler && signal.zome_name == this.zomeName) {
            this.signalHandler(signal);
        }
    }

    /** */
    getContext(): Context<unknown, unknown> {
        const context = createContext<typeof this>('zvm/'+ this._zomeProxy.defaultZomeName +'/' + this.cell.dnaId.b64)
        //console.log({contextType: typeof context})
        return context
    }


    /** */
    dumpSignalLogs(signalLogs: SignalLog[]) {
        console.warn(`All signals from zome "${this.zomeName}"`);
        console.table(prettySignalLogs(signalLogs));
    }
}
