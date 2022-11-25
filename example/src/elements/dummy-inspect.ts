import {html} from "lit";
import {DummyDvm, DummyZomePerspective} from "../viewModels/dummy";
import {DnaElement} from "@ddd-qc/dna-client";


/**
 *
 */
export class DummyInspect extends DnaElement<DummyZomePerspective, DummyDvm> {

  constructor() {
    super(DummyDvm)
  }

  /** */
  render() {
    console.log("DummyInspect render()", this._dvm)

    /** render all */
    return html`
      <h4>Dummy Inspect: "${this._dvm.roleId}"</h4>
      <div>dummyZvm: ${this._dvm.dummyZvm.zomeName}</div>
      <div>labelZvm: ${this._dvm.labelZvm.zomeName}</div>
    `
  }
}
