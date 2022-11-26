import {html} from "lit";
import {DummyDvm, DummyZomePerspective} from "../viewModels/dummy";
import {DnaElement} from "@ddd-qc/dna-client";


/**
 *
 */
export class DummyInspect extends DnaElement<DummyZomePerspective, DummyDvm> {

  constructor() {
    super(DummyDvm.DEFAULT_ROLE_ID)
  }

  /** */
  render() {
    console.log("<dummy-inspect> render()", this._dvm)

    /** render all */
    return html`
      <h4>Dummy Inspect: "${this._dvm.roleId}"</h4>
      <span>dummyZvm: ${this._dvm.dummyZvm.zomeName}</span> |
      <span>labelZvm: ${this._dvm.labelZvm.zomeName}</span>
    `
  }
}
