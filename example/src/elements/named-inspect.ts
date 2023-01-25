import {html} from "lit";
import { property } from "lit/decorators.js";
import {IntegerZomePerspective, NamedIntegerDvm} from "../viewModels/integer";
import {DnaElement} from "@ddd-qc/lit-happ";
import { NamedRealDvm, RealZomePerspective } from "../viewModels/real";


/**
 *
 */
export class NamedIntegerInspect extends DnaElement<IntegerZomePerspective, NamedIntegerDvm> {

  constructor() {
    super(NamedIntegerDvm.DEFAULT_BASE_ROLE_NAME)
  }


  /** */
  render() {
    console.log(`<named-integer-inspect> render(): ${this.cell.print()}`);
    /** render all */
    return html`
    <div>
      <span><b>Inspection of cell "${this.cell.name}":</b></span>
      <span>integerZvm: ${this._dvm.integerZvm.zomeName}</span> |
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
    console.log(`<named-real-inspect> render(): ${this.cell.print()}`);
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
