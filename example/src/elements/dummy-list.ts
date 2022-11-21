import {LitElement, html} from "lit";
import { state } from "lit/decorators.js";
import {ConductorAppProxy, EntryDefSelect, HappController, IDnaViewModel} from "@ddd-qc/dna-client";
import {DummyDvm, DummyZvm} from "../dummy";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";


export class DummyList extends ScopedElementsMixin(LitElement) {

  @state() private _loaded = false;

    /** */
    async firstUpdated() {
      this._loaded = true;
    }

  /** */
  render() {
    console.log("dummy-app render() called!")
    if (!this._loaded) {
      return html`<span>Loading...</span>`;
    }
}

