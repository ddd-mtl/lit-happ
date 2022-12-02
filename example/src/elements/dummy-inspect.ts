import {html} from "lit";
import { property } from "lit/decorators.js";
import {DummyDvm, DummyZomePerspective} from "../viewModels/dummy";
import {DnaElement} from "@ddd-qc/lit-happ";
import { RealDvm, RealZomePerspective } from "../viewModels/real";


/**
 *
 */
export class DummyInspect extends DnaElement<DummyZomePerspective, DummyDvm> {

  constructor() {
    super(DummyDvm.DEFAULT_ROLE_ID)
  }


  /** */
  render() {
    //console.log("<dummy-inspect> render()", this._dvm)
    /** render all */
    return html`
    <div>
      <span><b>Inspect "${this._dvm.roleId}":</b></span>
      <span>dummyZvm: ${this._dvm.dummyZvm.zomeName}</span> |
      <span>labelZvm: ${this._dvm.labelZvm.zomeName}</span>
    </div>
    `
  }
}


/**
 *
 */
 export class RealInspect extends DnaElement<RealZomePerspective, RealDvm> {

  /** Ctor */
  constructor() {
    super();
    const roleId = this.getAttribute("roleId");
    //console.log(roleId)
    this.roleId = roleId? roleId: RealDvm.DEFAULT_ROLE_ID;
    this.requestDvm();
  }

  /** */
  render() {
    //console.log("<real-inspect> render()", this.roleId)
    /** render all */
    return html`
    <div>
      <span><b>Inspect "${this._dvm.roleId}":</b></span>
      <span>realZvm: ${this._dvm.realZvm.zomeName}</span> |
      <span>labelZvm: ${this._dvm.labelZvm.zomeName}</span>
    </div>
    `
  }
}
