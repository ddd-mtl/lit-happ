import {ContextProvider} from "@lit-labs/context";
import {ReactiveControllerHost, ReactiveElement} from "lit";


/** Interface for the generic-less ViewModel class */
export interface IViewModel {
  provideContext(host: ReactiveElement): void;
  getContext(): any;  // FIXME context type
  get perspective(): any;
  probeAll(): Promise<void>;
  /** -- Observer pattern -- */
  subscribe(providedHost: ReactiveControllerHost, propName: PropertyKey): void;
  unsubscribe(candidat: ReactiveControllerHost): void;
}


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
 export abstract class ViewModel<P> implements IViewModel {

  /** -- Fields -- */
  protected _previousPerspective?: P;
  protected _providedHosts: [ReactiveControllerHost, PropertyKey][] = [];

  protected _provider?: any; // FIXME ContextProvider<this.getContext()>;

  /** -- IViewModel interface -- */

  /** Set ContextProvider for host */
  provideContext(providerHost: ReactiveElement): void {
      console.log(`Providing context "${this.getContext()}" | in host `, providerHost);
      this._provider = new ContextProvider(providerHost, this.getContext(), this);
  }

  abstract getContext(): any;
  abstract get perspective(): P;

  /* (optional) Lets the observer trigger probing in order to get an updated perspective */
  async probeAll(): Promise<void> {}


  /**
   * Return true if the perspective has changed. This will trigger an update on the observers
   * Child classes are expected to compare their latest constructed perspective (the one returned by this.perspective())
   * with this._previousPerspective.
   */
  protected abstract hasChanged(): boolean;


  /** -- Observer pattern -- */

  /** */
  subscribe(providedHost: ReactiveControllerHost, propName: PropertyKey): void {
      (providedHost as any)[propName] = this.perspective;
      this._providedHosts.push([providedHost, propName])
  }

  /** */
  unsubscribe(candidat: ReactiveControllerHost): void {
      let index  = 0;
      for (const [host, _propName] of this._providedHosts) {
          if (host === candidat) break;
          index += 1;
      }
      if (index > -1) {
          this._providedHosts.splice(index, 1);
      }
  }


  /** */
  protected notifySubscribers() {
      if (!this.hasChanged()) return;
      for (const [host, propName] of this._providedHosts) {
          (host as any)[propName] = this.perspective;
      }
      this._previousPerspective = this.perspective
  }

}
