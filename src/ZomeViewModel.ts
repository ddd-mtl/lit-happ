import { ReactiveElement } from "lit";
import { ZomeProxy } from "./ZomeProxy";
import { ViewModel } from "./ViewModel";
import { CellProxy } from "./CellProxy";

export type ZvmClass = {new(proxy: CellProxy): IZomeViewModel}

/** Interface for the generic-less ZomeViewModel class */
export interface IZomeViewModel {
    get zomeName(): string;
    fetchEntryDefs(): Promise<[string, boolean][]>;
    provideContext(host: ReactiveElement): void;
    probeAll(): Promise<void>;
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

    protected _entryDefs?:[string, boolean][];

    /** */
    async fetchEntryDefs(): Promise<[string, boolean][]> {
        //if (!this._entryDefs) {
            this._entryDefs = await this._zomeProxy.getEntryDefs();
        //}
        return this._entryDefs;
    }

    /** */
    get zomeName(): string { return this._zomeProxy.zomeName }

    //abstract probeAll(): Promise<void>;

}

