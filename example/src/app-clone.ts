import { html } from "lit";
import { state } from "lit/decorators.js";
import {EntryDefSelect, HvmDef, CellContext, HappElement, RoleInstanceId, CloneIndex} from "@ddd-qc/lit-happ";
import { DummyDvm } from "./viewModels/dummy";
import {RealCloneDvm, RealDvm} from "./viewModels/real";
import { DummyList } from "./elements/dummy-list";
import { RealList } from "./elements/real-list";
import { LabelList } from "./elements/label-list";
import { DummyInspect, RealInspect } from "./elements/dummy-inspect";

/**
 *
 */
export class PlaygroundCloneApp extends HappElement {

  /** Ctor */
  constructor() {
    super(Number(process.env.HC_PORT));
  }

  /** HvmDef */
  static HVM_DEF: HvmDef = {
    id: "playground-clone",
    dvmDefs: [
      {
        ctor: DummyDvm,
        isClonable: false,
        //canCreateOnInstall: true,
      },
      {
        ctor: RealCloneDvm,
        isClonable: true,
        //canCreateOnInstall: false,
      }
    ],
  };

  /** QoL */
  get dummyDvm(): DummyDvm { return this.hvm.getDvm(DummyDvm.DEFAULT_BASE_ROLE_NAME)! as DummyDvm }
  get realDvmClones(): RealCloneDvm[] {return this.hvm.getClones(RealDvm.DEFAULT_BASE_ROLE_NAME)! as RealCloneDvm[]}
  realDvmClone(index: CloneIndex): RealDvm { return this.hvm.getDvm(RoleInstanceId(RealDvm.DEFAULT_BASE_ROLE_NAME, index))! as RealDvm }


  /** override */
  async happInitialized(): Promise<void> {
    await this.hvm.probeAll();
  }

  /** */
  async onProbe(e: any) {
    await this.hvm.probeAll();
  }

  /** */
  async onAddClone(e: any) {
    await this.hvm.cloneDvm(RealCloneDvm.DEFAULT_BASE_ROLE_NAME)
    this.requestUpdate();
  }


  /** */
  async onEntrySelect(e: any) {
    //console.log("onEntrySelect() CALLED", e)
    const label = this.shadowRoot!.getElementById("entryLabel") as HTMLElement;
    label.innerText = JSON.stringify(e.detail);
  }


  /** */
  render() {
    //console.log("<playground-clone-app> render()", this.hvm);

    /** render all clones */
    const clones = Object.values(this.realDvmClones).map((realDvm) => {
      return html`
          <hr style="border-style:dotted;">
          <cell-context .installedCell="${realDvm.installedCell}">
              <h3>
                  Real: ${realDvm.hcl} | ${realDvm.cloneName}
                  <input type="button" value="dump logs" @click=${(e: any) => realDvm.dumpLogs()}>
              </h3>
              <real-list></real-list>
              <label-list></label-list>
          </cell-context>
      `;
    });


    return html`
      <div style="margin:10px;">
        <h2>${(this.constructor as any).HVM_DEF.id} App</h2>
        <input type="button" value="Probe hApp" @click=${this.onProbe}>
        <input type="button" value="Dump signals" @click=${(e:any) => {this.conductorAppProxy.dumpSignals()}}>
        <br/>
        <span>Select AppEntryType:</span>
        <entry-def-select .dnaViewModel="${this.dummyDvm}" @entrySelected=${this.onEntrySelect}></entry-def-select>
        <div style="margin:10px;">
            <span><span id="entryLabel">none</span></span>
        </div>
        <!-- INSPECTORS -->
        <hr style="border-style:solid;">
        <dummy-inspect></dummy-inspect> 
        <real-inspect></real-inspect> 
        <!-- DUMMY -->          
        <hr style="border-style:solid;">
        <cell-context .installedCell="${this.dummyDvm.installedCell}">
          <h2>
            Dummy: ${this.dummyDvm.hcl} 
            <input type="button" value="dump logs" @click=${(e: any) => this.dummyDvm.dumpLogs()}>
          </h2>
          <dummy-list></dummy-list>
          <label-list></label-list>
        </cell-context>
        <!-- Clones -->
        <hr style="border-style:solid;">
        <h2>Clones of "${RealCloneDvm.DEFAULT_BASE_ROLE_NAME}": ${this.realDvmClones.length}</h2>
        <input type="button" value="Add" @click=${this.onAddClone}>
        ${clones}
      </div>
    `
  }


  /** */
  static get scopedElements() {
    return {
      "entry-def-select": EntryDefSelect,
      "dummy-inspect": DummyInspect,
      "real-inspect": RealInspect,
      "dummy-list": DummyList,
      "real-list": RealList,
      "label-list": LabelList,
      "cell-context": CellContext,
    };
  }
}

//DummyApp.addInitializer(initializeHapp);
