import {ZomeBridge} from "./ZomeBridge";


/**
 * Represents the ViewModel of a zome.
 * It is an Observable meant to be a singleton passed around by a Context.
 * It queries a cell's zome to get the agent's perspective (by callind a Zome Bridge).
 * LitElement hosts can subscribe to it in order to get updated when the perspective changes.
 * Hosts could also be allowed to trigger probing in order to get an updated perspective.
 */
export abstract class ZomeViewModel<P, B extends ZomeBridge> {

    constructor(protected _bridge: B) {}

    /** -- Fields -- */

    protected _previousPerspective?: P;
    protected _hosts: [any, PropertyKey][] = [];


    /** -- Methods that children must implement  --*/
    /**
     * Return true if the perspective has changed. This will trigger an update on the observers
     * Child classes are expected to compare their latest constructed perspective (the one returned by this.perspective())
     * with this._previousPerspective.
     */
    protected abstract hasChanged(): boolean;
    /* Returns the latest perspective */
    abstract get perspective(): P;
    /* (optional) Lets the observer trigger probing of the DHT in order to get an updated perspective */
    async probeDht(): Promise<void> {}


    /** -- Final methods (Observer pattern) -- */

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
    protected notify() {
        if (!this.hasChanged()) return;
        for (const [host, propName] of this._hosts) {
            host[propName] = this.perspective;
        }
        this._previousPerspective = this.perspective
    }
}
