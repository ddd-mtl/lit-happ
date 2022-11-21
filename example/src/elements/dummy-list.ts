import {LitElement, html} from "lit";
import {state, property} from "lit/decorators.js";
import {ConductorAppProxy, EntryDefSelect, HappController, IDnaViewModel} from "@ddd-qc/dna-client";
import {contextProvided} from "@lit-labs/context";
import {DummyDvm, DummyZomePerspective, DummyZvm} from "../dummy";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";


export class DummyList extends ScopedElementsMixin(LitElement) {

  @state() private _loaded = false;

  @contextProvided({ context: DummyZvm.context, subscribe: true })
  _dummyZvm!: DummyZvm;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  dummyPerspective!: DummyZomePerspective;


  /** */
  async firstUpdated() {
    this._dummyZvm.subscribe(this, 'dummyPerspective');
    this._loaded = true;
  }

  /** */
  render() {
    console.log("<dummy-list> render()")
    if (!this._loaded) {
      return html`<span>Loading...</span>`;
    }

    const dummyLi = Object.values(this.dummyPerspective.values).map(
      (value) => {
        return html`<li>${value}</li>`
      }
    );

    /** render all */
    return html`
      <ul>
          ${dummyLi}
      </ul>
    `

  }
}

