import { ReactiveElement } from "lit";
import { ZomeProxy } from "./ZomeProxy";
import { ViewModel } from "./ViewModel";
import { CellProxy } from "./CellProxy";
import {createContext} from "@lit-labs/context";

export type ZvmClass = {new(proxy: CellProxy): IZomeViewModel}

/** Interface for the generic-less ZomeViewModel class */
export interface IZomeViewModel {
    get zomeName(): string;
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

    get zomeName(): string { return this._zomeProxy.zomeName }
    get dnaHash(): string { return this._zomeProxy.dnaHash }

    getContext(): any {
        const context = createContext<typeof this>('zvm/'+ this.zomeName +'/' + this.dnaHash)
        console.log({context})
        return context
    }
}

