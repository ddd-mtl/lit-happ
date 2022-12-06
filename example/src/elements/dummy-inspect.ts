import {html} from "lit";
import { property } from "lit/decorators.js";
import {DummyDvm, DummyZomePerspective} from "../viewModels/dummy";
import {DnaElement} from "@ddd-qc/lit-happ";
import { RealDvm, RealZomePerspective } from "../viewModels/real";
import {printInstalledCell} from "@ddd-qc/cell-proxy";


/**
 *
 */
export class DummyInspect extends DnaElement<DummyZomePerspective, DummyDvm> {

  constructor() {
    super(DummyDvm.DEFAULT_BASE_ROLE_NAME)
  }


  /** */
  render() {
    console.log(`<dummy-inspect> render() of "${this.baseRoleName}":  ${printInstalledCell(this._dvm)}`);
    /** render all */
    return html`
    <div>
      <span><b>Inspect "${this._dvm.baseRoleName}":</b></span>
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
    const baseRoleName = this.getAttribute("baseRoleName");
    //console.log(roleId)
    this.baseRoleName = baseRoleName? baseRoleName: RealDvm.DEFAULT_BASE_ROLE_NAME;
    this.requestDvm();
  }

  /** */
  render() {
    console.log(`<real-inspect> render() of "${this.baseRoleName}":  ${printInstalledCell(this._dvm)}`);
    /** render all */
    return html`
    <div>
      <span><b>Inspect "${this._dvm.baseRoleName}":</b></span>
      <span>realZvm: ${this._dvm.realZvm.zomeName}</span> |
      <span>labelZvm: ${this._dvm.labelZvm.zomeName}</span>
    </div>
    `
  }
}
