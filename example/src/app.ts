import { html } from "lit";
import { state } from "lit/decorators.js";
import { ConductorAppProxy, EntryDefSelect, HvmDef, HappViewModel, CellContext, HappElement } from "@ddd-qc/lit-happ";
import { NamedIntegerDvm } from "./viewModels/dummy";
import { NamedRealDvm } from "./viewModels/real";
import { DummyList } from "./elements/dummy-list";
import { RealList } from "./elements/real-list";
import { LabelList } from "./elements/label-list";
import {NamedNumberInspect, NamedRealInspect} from "./elements/named-inspect";


/** TESTING Decorator for better init */
/** Doesn't solve our problem since our initializer is doing an async call */

interface IHapp {
  get conductorAppProxy(): ConductorAppProxy;
  get hvm(): HappViewModel;
}


// class Happ {
//   conductorAppProxy!: ConductorAppProxy;
//   hvm!: HappViewModel;
// }

// // A TypeScript decorator
// const happy = (proto: ReactiveElement, key: string) => {
//   const ctor = proto.constructor as typeof ReactiveElement;

//   ctor.addInitializer(async (instance: ReactiveElement) => {
//     console.log("initializeHapp()", instance, key);
//     //const happElem = await HappElement.new(Number(process.env.HC_PORT), playgroundHappDef);

//     let happEl = {} as Happ;
//     happEl.conductorAppProxy = await ConductorAppProxy.new(Number(process.env.HC_PORT));
//     happEl.hvm = await HappViewModel.new(instance, happEl.conductorAppProxy, playgroundDef);

//     (instance as any)[key] = happEl;
//     console.log("initializeHapp() Done", happEl);
//     //instance.addController(happElem)
//     instance.requestUpdate();
//   });
// };



// /** */
// async function initializeHapp(instance: ReactiveElement) {
//   console.log("initializeHapp()", instance);
//   // let HC_PORT = Number(process.env.HC_PORT);
//   // this._conductorAppProxy = await ConductorAppProxy.new(HC_PORT);
//   // this._happ = await this._conductorAppProxy.newHappViewModel(this, PlaygroundHappDef); // FIXME this can throw an error
//   //
//   // await this._happ.probeAll();

//   //await dummyDvm.fetchAllEntryDefs();

//   const happElem = HappElement.new(Number(process.env.HC_PORT), playgroundHappDef)
//   //instance['happ'] = happElem;
//   instance.addController(happElem)
// }


/**
 *
 */
export class PlaygroundApp extends HappElement {

  /** Ctor */
  constructor() {
    super(Number(process.env.HC_PORT));
  }

  /** HvmDef */
  static HVM_DEF: HvmDef = {
    id: "playground",
    dvmDefs: [
      {
        ctor: NamedIntegerDvm,
        isClonable: false,
      },
      {
        ctor: NamedRealDvm,
        isClonable: false,
      },
      {
        ctor: NamedRealDvm,
        baseRoleName: "rImpostor",
        isClonable: false,
      }
    ],
  };


  /** QoL */
  get integerDvm(): NamedIntegerDvm { return this.hvm.getDvm(NamedIntegerDvm.DEFAULT_BASE_ROLE_NAME)! as NamedIntegerDvm }
  get impostorDvm(): NamedRealDvm { return this.hvm.getDvm("rImpostor")! as NamedRealDvm }
  get realDvm(): NamedRealDvm { return this.hvm.getDvm(NamedRealDvm.DEFAULT_BASE_ROLE_NAME)! as NamedRealDvm }


  //@happy _happ!: HappElement;
  //_happ!: IHapp;

  @state() private _selectedZomeName = ""


  async happInitialized(): Promise<void> {
    await this.hvm.probeAll();
  }

  /** */
  async onProbe(e: any) {
    //let entryDefs = await this.dummyDvm.fetchAllEntryDefs();
    //console.log({entryDefs})
    this.hvm.probeAll();
  }


  /** */
  async onEntrySelect(e: any) {
    //console.log("onEntrySelect() CALLED", e)
    const label = this.shadowRoot!.getElementById("entryLabel") as HTMLElement;
    label.innerText = JSON.stringify(e.detail);
  }


  /** */
  render() {
    console.log("<playground-app> render()", this.hvm);


    //const maybeImpostor = html``;
    const maybeImpostor = html`
      <cell-context .installedCell="${this.impostorDvm.installedCell}">
          <hr class="solid">
          <h2>
              Impostor Role: ${this.impostorDvm.hcl.toString()}
              <input type="button" value="dump logs" @click=${(e: any) => this.impostorDvm.dumpLogs()}>
          </h2>
          <real-list></real-list>
          <label-list></label-list>
      </cell-context>
    `;

    return html`
      <div style="margin:10px;">
        <h2>${(this.constructor as any).HVM_DEF.id} App</h2>
        <input type="button" value="Probe hApp" @click=${this.onProbe}>
        <input type="button" value="Dump signals" @click=${(e:any) => {this.conductorAppProxy.dumpSignals()}}>
        <br/>
        <!-- SELECT ENTRY TYPE -->
        <span>Select AppEntryType:</span>
        <entry-def-select .dnaViewModel="${this.integerDvm}" @entrySelected=${this.onEntrySelect}></entry-def-select>
        <div style="margin:10px;">
            <span><span id="entryLabel">none</span></span>
        </div>
        <!-- INSPECTORS -->
        <hr class="solid">
        <cell-context .installedCell="${this.integerDvm.installedCell}">
            <named-number-inspect></named-number-inspect>
        </cell-context>
        <cell-context .installedCell="${this.realDvm.installedCell}">
          <named-real-inspect></named-real-inspect>
        </cell-context>
        <cell-context .installedCell="${this.impostorDvm.installedCell}">
          <named-real-inspect baseRoleName="rImpostor"></named-real-inspect>
        </cell-context>
        <!-- Integer cell -->          
        <hr class="solid">
        <cell-context .installedCell="${this.integerDvm.installedCell}">
          <h2>
            Dummy Role: ${this.integerDvm.hcl.toString()} 
            <input type="button" value="dump logs" @click=${(e: any) => this.integerDvm.dumpLogs()}>
          </h2>
          <dummy-list></dummy-list>
          <label-list></label-list>
        </cell-context>
        <!-- Real cells -->
        <cell-context .installedCell="${this.realDvm.installedCell}">
          <hr class="solid">
          <h2>
            Real Role: ${this.realDvm.hcl.toString()}
            <input type="button" value="dump logs" @click=${(e: any) => this.realDvm.dumpLogs()}>
          </h2>
          <real-list></real-list>
          <label-list></label-list>
        </cell-context>
        ${maybeImpostor}
      </div>
    `
  }


  /** */
  static get scopedElements() {
    return {
      "entry-def-select": EntryDefSelect,
      "named-number-inspect": NamedNumberInspect,
      "named-real-inspect": NamedRealInspect,
      "dummy-list": DummyList,
      "real-list": RealList,
      "label-list": LabelList,
      "cell-context": CellContext,
    };
  }
}

//DummyApp.addInitializer(initializeHapp);
