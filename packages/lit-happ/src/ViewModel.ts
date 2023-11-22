import {Context, ContextProvider} from "@lit/context";
import {ReactiveControllerHost, ReactiveElement} from "lit";
import {AppSignalCb} from "@holochain/client";

import { Mutex } from 'async-mutex';


enum InitializationState {
  Uninitialized = "Uninitialized",
  InitializingOffline = "InitializingOffline",
  InitializingOnline = "InitializingOnline",
  Initialized = "Initialized",
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
 export abstract class ViewModel {

  /** -- Fields -- */
  protected _previousPerspective?: unknown;
  protected _providedHosts: [ReactiveControllerHost, PropertyKey][] = [];
  protected _provider?: unknown; // FIXME type: ContextProvider<this.getContext()>;

  //protected _initializationState: InitializationState = InitializationState.Uninitialized;


  protected _probeMutex = new Mutex();

  /** -- Abstract fields -- */

  abstract signalHandler?: AppSignalCb;


  /** -- Abstract methods -- */

  abstract getContext(): Context<unknown, unknown>;
  /* Child class should implement with specific type */
  abstract get perspective(): unknown;

  /* (optional) Set perspective with data from the source-chain only */
  async initializePerspectiveOffline(): Promise<void> {}
  /* (optional) Set perspective with data from the DHT */
  async initializePerspectiveOnline(): Promise<void> {}
  /* (optional) Lets the observer trigger probing into the network in order to get an updated perspective */
  protected probeAllInner(): void {};

  /**
   * Mutex wrapping of probeAllInner: Don't call probeAll() during a probeAll()
   * Should not be async as we expect this to be long, so happs are expected to use signals instead if something changed.
   */
  probeAll(): void {
    // if (this._initializationState !== InitializationState.Initialized) {
    //   console.warn("probeAll() called on unitialized ViewModel");
    //   return;
    // }
    if (this._probeMutex.isLocked()) {
      console.log("probeAll() call skipped. Reason: Already running.");
      return;
    }
    this._probeMutex
      .acquire()
      .then(async (release) => {
        this.probeAllInner();
        release();
      });
  }

  /**
   * Return true if the perspective has changed. This will trigger an update on the observers
   * Child classes are expected to compare their latest constructed perspective (the one returned by this.perspective())
   * with this._previousPerspective.
   */
  protected abstract hasChanged(): boolean;


  /** -- Final methods -- */

  /** Set ContextProvider for host */
  provideContext(providerHost: ReactiveElement): void {
    console.log(`\t\tProviding context "${this.getContext()}" | in host `, providerHost);
    this._provider = new ContextProvider(providerHost, this.getContext(), this);
  }

  /** -- Observer pattern -- */

  /** */
  subscribe(providedHost: ReactiveControllerHost, propName: PropertyKey): void {
      (providedHost as any)[propName] = this.perspective;
      this._providedHosts.push([providedHost, propName])
  }

  /** */
  unsubscribe(candidate: ReactiveControllerHost): void {
      let index  = 0;
      for (const [host, _propName] of this._providedHosts) {
          if (host === candidate) break;
          index += 1;
      }
      if (index > -1) {
          this._providedHosts.splice(index, 1);
      }
  }

  /** */
  protected notifySubscribers(): boolean {
    if (!this.hasChanged()) return false;
      //this._previousPerspective = structuredClone(this.perspective);
      this._previousPerspective = this.perspective;
      for (const [host, propName] of this._providedHosts) {
      (host as any)[propName] = this._previousPerspective;
    }
    return true;
  }

}
