import { ReactiveElement } from "lit";
import { ZomeProxy } from "./ZomeProxy";
import { ViewModel } from "./ViewModel";
import { DnaProxy } from "./DnaProxy";

export type ZvmClass = {new(dnaProxy: DnaProxy): IZomeViewModel}

/** Interface for the generic-less ZomeViewModel class */
export interface IZomeViewModel {
    get zomeName(): string;
    getEntryDefs(): Promise<[string, boolean][]>;
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
    protected constructor(protected _proxy: T) {
        super();
    }

    /** */
    async getEntryDefs(): Promise<[string, boolean][]> {
        return this._proxy.getEntryDefs()
    }

    /** */
    get zomeName(): string { return this._proxy.zomeName }

    //abstract probeAll(): Promise<void>;

}

