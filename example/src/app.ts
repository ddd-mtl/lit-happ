import {LitElement, html, ReactiveElement} from "lit";
import { state } from "lit/decorators.js";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { ConductorAppProxy, EntryDefSelect, HappDef, HappViewModel, IDnaViewModel, CellContext, HappElement } from "@ddd-qc/dna-client";
import { DummyDvm } from "./viewModels/dummy";
import {RealDvm} from "./viewModels/real";
import { DummyList } from "./elements/dummy-list";
import {RealList} from "./elements/real-list";
import {LabelList} from "./elements/label-list";
import {DummyInspect} from "./elements/dummy-inspect";


/** */
export const playgroundHappDef: HappDef = {
  id: "playground",
  dvmDefs: [
    DummyDvm,
    RealDvm,
    [RealDvm, "rImpostor"],
  ]
}

/** TESTING Decorator for better init */
/** Doesn't solve our problem since our initializer is doing an async call */

interface IHapp {
  get conductorAppProxy(): ConductorAppProxy;
  get hvm(): HappViewModel;
}


class Happ {
  conductorAppProxy!: ConductorAppProxy;
  hvm!: HappViewModel;
}

// A TypeScript decorator
const happy = (proto: ReactiveElement, key: string) => {
  const ctor = proto.constructor as typeof ReactiveElement;

  ctor.addInitializer(async (instance: ReactiveElement) => {
    console.log("initializeHapp()", instance, key);
    //const happElem = await HappElement.new(Number(process.env.HC_PORT), playgroundHappDef);

    let happEl = {} as Happ;
    happEl.conductorAppProxy = await ConductorAppProxy.new(Number(process.env.HC_PORT));
    happEl.hvm = await happEl.conductorAppProxy.newHappViewModel(instance, playgroundHappDef); // FIXME this can


    (instance as any)[key] = happEl;
    console.log("initializeHapp() Done", happEl);
    //instance.addController(happElem)
    instance.requestUpdate();
  });
};



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
export class DummyApp extends ScopedElementsMixin(LitElement) {

  constructor() {
    super();
    this.initHapp();
  }

  //@happy _happ!: HappElement;
  _happ!: IHapp;

  @state() private _selectedZomeName = ""

  get dummyDvm(): IDnaViewModel { return this._happ.hvm.getDvm(DummyDvm.DEFAULT_ROLE_ID)! }
  get impostorDvm(): IDnaViewModel { return this._happ.hvm.getDvm("rImpostor")! }
  get realDvm(): IDnaViewModel { return this._happ.hvm.getDvm(RealDvm.DEFAULT_ROLE_ID)! }


  /** */
  async initHapp() {
    const conductorAppProxy = await ConductorAppProxy.new(Number(process.env.HC_PORT));
    const hvm = await conductorAppProxy.newHappViewModel(this, playgroundHappDef); // FIXME this can throw an error
    this._happ = {conductorAppProxy,hvm}
    this.requestUpdate();
  }


  /** */
  shouldUpdate() {
    return !!this._happ;
  }


  /** */
  async onProbe(e: any) {
    //let entryDefs = await this.dummyDvm.fetchAllEntryDefs();
    //console.log({entryDefs})
    this._happ.hvm.probeAll();
  }


  /** */
  async onEntrySelect(e: any) {
    //console.log("onEntrySelect() CALLED", e)
    const label = this.shadowRoot!.getElementById("entryLabel") as HTMLElement;
    label.innerText = JSON.stringify(e.detail);
  }


  /** */
  render() {
    console.log("<dummy-app> render()", this._happ);

    return html`
      <div style="margin:10px;">
        <h2>Playground App</h2>
        <input type="button" value="Probe hApp" @click=${this.onProbe}>
        <br/>
        <span>Select AppEntryType:</span>
        <entry-def-select .dnaViewModel="${this.dummyDvm}" @entrySelected=${this.onEntrySelect}></entry-def-select>
        <div style="margin:10px;">
            <span><span id="entryLabel">none</span></span>
        </div>
        <hr class="solid">
        <dummy-inspect></dummy-inspect>  
        <hr class="solid">
        <cell-context .installedCell="${this.dummyDvm.installedCell}">
          <h2>
            Dummy Cell: ${this.dummyDvm.dnaHash} 
            <input type="button" value="dump logs" @click=${(e:any) => this.dummyDvm.dumpLogs()}>
          </h2>
          <dummy-list></dummy-list>
          <label-list></label-list>
        </cell-context>
        <cell-context .installedCell="${this.realDvm.installedCell}">
          <hr class="solid">          
          <h2>
            Real Cell: ${this.realDvm.dnaHash} 
            <input type="button" value="dump logs" @click=${(e:any) => this.realDvm.dumpLogs()}>
          </h2>
          <real-list></real-list>
          <label-list></label-list>
        </cell-context>
        <cell-context .installedCell="${this.impostorDvm.installedCell}">
          <hr class="solid">          
          <h2>
            Impostor Cell: ${this.impostorDvm.dnaHash} 
            <input type="button" value="dump logs" @click=${(e:any) => this.impostorDvm.dumpLogs()}>
          </h2>
          <real-list></real-list>
          <label-list></label-list>
        </cell-context>
      </div>
    `
  }

  static get scopedElements() {
    return {
      "entry-def-select": EntryDefSelect,
      "dummy-inspect": DummyInspect,
      "dummy-list": DummyList,
      "real-list": RealList,
      "label-list": LabelList,
      "cell-context": CellContext,
    };
  }
}

//DummyApp.addInitializer(initializeHapp);
