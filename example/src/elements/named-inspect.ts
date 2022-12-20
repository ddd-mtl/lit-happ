import {html} from "lit";
import { property } from "lit/decorators.js";
import {NamedIntegerDvm, DummyZomePerspective} from "../viewModels/dummy";
import {DnaElement} from "@ddd-qc/lit-happ";
import { NamedRealDvm, RealZomePerspective } from "../viewModels/real";
import {printInstalledCell} from "@ddd-qc/cell-proxy";


/**
 *
 */
export class NamedNumberInspect extends DnaElement<DummyZomePerspective, NamedIntegerDvm> {

  constructor() {
    super(NamedIntegerDvm.DEFAULT_BASE_ROLE_NAME)
  }


  /** */
  render() {
    console.log(`<named-number-inspect> render(): ${printInstalledCell(this._dvm)}" | ${this.installedCell.role_id}`);
    /** render all */
    return html`
    <div>
      <span><b>Inspection of cell "${this.baseRoleName}":</b></span>
      <span>dummyZvm: ${this._dvm.dummyZvm.zomeName}</span> |
      <span>labelZvm: ${this._dvm.labelZvm.zomeName}</span>
    </div>
    `
  }
}


/**
 *
 */
 export class NamedRealInspect extends DnaElement<RealZomePerspective, NamedRealDvm> {

  /** Ctor */
  constructor() {
    super();
    const baseRoleName = this.getAttribute("baseRoleName");
    //console.log(roleId)
    this.baseRoleName = baseRoleName? baseRoleName: NamedRealDvm.DEFAULT_BASE_ROLE_NAME;
    this.requestDvm();
  }


  protected async dvmUpdated(newDvm: NamedRealDvm, oldDvm?: NamedRealDvm): Promise<void> {
    console.log(`\t\t NamedRealInspect dvmUpdated() called`)
  }

  /** */
  render() {
    console.log(`<named-real-inspect> render(): ${printInstalledCell(this._dvm)}" | ${this.installedCell.role_id}`);
    /** render all */
    return html`
    <div>
      <span><b>Inspection of cell "${this.baseRoleName}":</b></span>
      <span>realZvm: ${this._dvm.realZvm.zomeName}</span> |
      <span>labelZvm: ${this._dvm.labelZvm.zomeName}</span>
    </div>
    `
  }
}
