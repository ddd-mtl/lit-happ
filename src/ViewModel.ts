import {ContextProvider} from "@lit-labs/context";
import {ReactiveElement} from "lit";


/** Interface for a generic ViewModel */
// export abstract class ViewModel {
//     provideContext(host: ReactiveElement): void {
//         new ContextProvider(host, this.getContext(), this);
//     }
//     abstract getContext(): any; // FIXME: use context type

//     abstract probeDht(): Promise<void>;    
//     abstract get perspective(): any;
// }


/**
 * ABC of a ViewModel.
 * It mediates the interaction between a View (CustomElements) and a Model (Zome / DNA).
 * It is an Observable meant to be observed by (Lit) ReactiveElements.
 * It is meant to be a singleton passed around by a (Lit) Context.
 * The ViewModel contains a perspective: All the data that a view can observe.
 * To update subscribers, it makes use of Lit's reactive properties.
 * When subscribing, a host must provide a reactive property that has the ViewModel's perspestives's type.
 * Hosts can trigger probing in order to get an updated perspective. 
 * The perspective can be automatically updated by internal events.
 */
 export abstract class ViewModel<P> {

    /** -- Fields -- */
    protected _previousPerspective?: P;
    protected _hosts: [any /*ReactiveElement*/, PropertyKey][] = [];

    /** Make sure provideContext is only called once? */
    //static _isContextProvided = false;
    provideContext(host: ReactiveElement): void {
        console.log("provideContext() called in ViewModel", host, this)
        // if (this._isContextProvided) {
        //     console.error("Context already provided for", typeof this)
        //     return;
        // }
        new ContextProvider(host, this.getContext(), this);
        //this._isContextProvided = true;
    }


    /** -- Methods that children must implement  --*/
    /**
     * Return true if the perspective has changed. This will trigger an update on the observers
     * Child classes are expected to compare their latest constructed perspective (the one returned by this.perspective())
     * with this._previousPerspective.
     */
    protected abstract hasChanged(): boolean;
    /* Returns the latest perspective */
    abstract get perspective(): P;
    abstract getContext(): any;
    /* (optional) Lets the observer trigger probing in order to get an updated perspective */
    async probeAll(): Promise<void> {}


    /** -- Observer pattern -- */

    /** */
    subscribe(host: any, propName: PropertyKey) {
        host[propName] = this.perspective;
        this._hosts.push([host, propName])
    }

    /** */
    unsubscribe(candidat: any) {
        let index  = 0;
        for (const [host, _propName] of this._hosts) {
            if (host === candidat) break;
            index += 1;
        }
        if (index > -1) {
            this._hosts.splice(index, 1);
        }
    }

    /** */
    protected notifySubscribers() {
        if (!this.hasChanged()) return;
        for (const [host, propName] of this._hosts) {
            host[propName] = this.perspective;
        }
        this._previousPerspective = this.perspective
    }

}
