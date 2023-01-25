import { html } from "lit";
import { state } from "lit/decorators.js";
import {
  EntryDefSelect, HvmDef, CellContext, HappElement, CellDef, HCL, ViewCellContext, createCloneName, Cell
} from "@ddd-qc/lit-happ";
import { NamedIntegerDvm } from "./viewModels/integer";
import { NamedRealCloneDvm, NamedRealDvm } from "./viewModels/real";
import { IntegerList } from "./elements/integer-list";
import { RealList } from "./elements/real-list";
import { LabelList } from "./elements/label-list";
import { NamedRealInspect } from "./elements/named-inspect";
import { AdminWebsocket } from "@holochain/client";


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
        ctor: NamedIntegerDvm,
        isClonable: true,
        //canCreateOnInstall: true,
      },
      {
        ctor: NamedRealCloneDvm,
        isClonable: true,
        //canCreateOnInstall: false,
      }
    ],
  };

  @state() private _integerCell?: Cell;

  @state() private _initialized = false;


  /** QoL */
  get integerDvm(): NamedIntegerDvm { return this.hvm.getDvm(NamedIntegerDvm.DEFAULT_BASE_ROLE_NAME)! as NamedIntegerDvm }
  get integerDvmCount(): number {return this.hvm.getClones(NamedIntegerDvm.DEFAULT_BASE_ROLE_NAME).length }


  integerDvmClone(cloneName: string): NamedIntegerDvm { return this.hvm.getDvm(new HCL(this.hvm.appId, NamedIntegerDvm.DEFAULT_BASE_ROLE_NAME, cloneName))! as NamedIntegerDvm }

  get realDvmClones(): NamedRealCloneDvm[] { return this.hvm.getClones(NamedRealDvm.DEFAULT_BASE_ROLE_NAME)! as NamedRealCloneDvm[] }
  realDvmClone(cloneName: string): NamedRealDvm { return this.hvm.getDvm(new HCL(this.hvm.appId, NamedRealDvm.DEFAULT_BASE_ROLE_NAME, cloneName))! as NamedRealDvm }


  @state() private _selectedClone: HCL = new HCL("playground-clone", NamedRealDvm.DEFAULT_BASE_ROLE_NAME)

  /** override */
  async happInitialized(): Promise<void> {
    /** Authorize all zome calls */
    const adminWs = await AdminWebsocket.connect(`ws://localhost:${process.env.ADMIN_PORT}`);
    console.log({ adminWs });
    await this.hvm.authorizeAllZomeCalls(adminWs);
    console.log("*** Zome call authorization complete");
    /** Probe */
    this._integerCell = this.integerDvm.cell;
    await this.hvm.probeAll();
    /** Done */
    this._initialized = true;
  }

  /** */
  async onProbe(e: any) {
    await this.hvm.probeAll();
  }

  /** */
  async cloneInteger() {
    const count = this.integerDvmCount;
    const cloneName = createCloneName(NamedIntegerDvm.DEFAULT_BASE_ROLE_NAME, count);
    const cellDef: CellDef = {
      modifiers: {
        network_seed: "integerClone_" + count,
        properties: {},
      },
      cloneName,
    }
      ;
    await this.createClone(NamedIntegerDvm.DEFAULT_BASE_ROLE_NAME, cellDef);
    const myWorldDvm = this.integerDvmClone(cloneName);
    this._integerCell = myWorldDvm.cell;
    console.log("IntegerDvm cloned: ", myWorldDvm.cell, count);
  }


  /** */
  async onAddClone(e: any) {
    await this.hvm.cloneDvm(NamedRealCloneDvm.DEFAULT_BASE_ROLE_NAME)
    this.requestUpdate();
  }

  /** */
  async onAddNamedClone(e: any) {
    const input = this.shadowRoot!.getElementById("namedInput") as HTMLInputElement;
    const name = String(input.value);
    const cellDef: CellDef = { modifiers: { network_seed: name }, cloneName: name };
    await this.hvm.cloneDvm(NamedRealCloneDvm.DEFAULT_BASE_ROLE_NAME, cellDef);
    input.value = "";
    this.requestUpdate();
  }


  /** */
  async onCloneSelect(e: any) {
    const input = this.shadowRoot!.getElementById("cloneSelector") as HTMLInputElement;
    console.log("onCloneSelect()", input.value);
    this._selectedClone = HCL.parse(String(input.value));

  }

  /** */
  async onEntrySelect(e: any) {
    //console.log("onEntrySelect() CALLED", e)
    const label = this.shadowRoot!.getElementById("entryLabel") as HTMLElement;
    label.innerText = JSON.stringify(e.detail);
  }


  /** */
  render() {
    console.log("<playground-clone-app> render()", this._selectedClone);

    if (!this._initialized) {
      return html`<span>Loading...</span>`;
    }

    /** Clone list */
    const cloneLis = Object.values(this.realDvmClones).map((realDvm) => {
      return html`<option>${realDvm.hcl.toString()}</option>`;
    });


    /** Render selected clone */
    const selectedDvm = this.hvm.getDvm(this._selectedClone)!;
    console.log("selectedDvm", selectedDvm, selectedDvm.cell.id);

    /** render all clones */
    const clones = Object.values(this.realDvmClones).map((realDvm) => {
      return html`
          <hr style="border-style:dotted;">
          <cell-context .cell="${realDvm.cell}">
              <h3>
                ${realDvm.hcl.toString()}
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
        <input type="button" value="Dump signals" @click=${(e: any) => { this.conductorAppProxy.dumpSignals() }}>
        <br/>
        <span>Select AppEntryType:</span>
        <entry-def-select .dnaViewModel="${this.integerDvm}" @entrySelected=${this.onEntrySelect}></entry-def-select>
        <div style="margin:10px;">
            <span><span id="entryLabel">none</span></span>
        </div>
        <input type="button" value="Clone Integer ${this.integerDvmCount}" @click=${() => { this.cloneInteger() }}>
        <!-- INTEGER -->          
        <hr style="border-style:solid;">
        <cell-context .cell="${this._integerCell}">
          <h2>
            Integer: ${this.integerDvm.hcl.toString()} 
            <input type="button" value="dump logs" @click=${(e: any) => this.integerDvm.dumpLogs()}>
          </h2>
          <integer-list></integer-list>
          <label-list></label-list>
        </cell-context>
        <!-- CLONE -->
        <hr style="border-style:solid;">
        <h2>Clones of "${NamedRealCloneDvm.DEFAULT_BASE_ROLE_NAME}": ${this.realDvmClones.length}</h2>
        <input type="button" value="Add nameless clone" @click=${this.onAddClone}>
        <br/>        <br/>
        <input type="text" id="namedInput" name="Value">
        <input type="button" value="Add named clone" @click=${this.onAddNamedClone}>
        <select id="cloneSelector" @click=${this.onCloneSelect}>
          ${cloneLis}
        </select>
        <!-- Selected Clone -->          
        <hr style="border-style:dotted;">
        <cell-context .cell="${selectedDvm.cell}">
            <view-cell-context></view-cell-context>
            <h3>
                Selected: ${selectedDvm.cell.name} - ${selectedDvm.hcl.toString()}
                <input type="button" value="dump logs" @click=${(e: any) => selectedDvm.dumpLogs()}>
            </h3>
            <named-real-inspect></named-real-inspect>
            <real-list></real-list>
            <label-list></label-list>
        </cell-context>
        <!-- All Clones -->
        <hr style="border-style:solid;">
        ${clones}
      </div>
    `
  }


  /** */
  static get scopedElements() {
    return {
      "entry-def-select": EntryDefSelect,
      "named-real-inspect": NamedRealInspect,
      "integer-list": IntegerList,
      "real-list": RealList,
      "label-list": LabelList,
      "cell-context": CellContext,
      "view-cell-context": ViewCellContext,
    };
  }
}

//DummyApp.addInitializer(initializeHapp);
