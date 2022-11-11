


// export interface ZomeViewModelInterface<T extends {}> {
//     hasChanged(): boolean;
//     get perspective(): T | {};
//     probeDht(): Promise<void>;
// }


/**
 * Represents the ViewModel of a zome.
 * It is an Observable meant to be a singleton passed around with a LitContext.
 * It queries a cell's zome to get the agent's perspective (by callind a Zome Bridge).
 * LitElement hosts can subscribe to it in order to get updated when the perspective changes.
 * Hosts can also trigger probing in order to get an updated perspective.
 * It is expected from child classes to implement the ZomeViewModelInterface.
 */
export class ZomeViewModel<T extends {}> /*implements ZomeViewModelInterface<T>*/ {

    /** Dummy implementation ZomeViewModelInterface */
    get perspective(): T { return {} as T }
    protected hasChanged(): boolean { return true }
    async probeDht(): Promise<void> {}

    protected _previousPerspective?: any;
    protected _hosts: [any, PropertyKey][] = [];


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