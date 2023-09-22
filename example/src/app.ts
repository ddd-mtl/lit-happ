import { html } from "lit";
import { state } from "lit/decorators.js";
import {
  AppProxy,
  HvmDef,
  HappViewModel,
  HappElement,
  printCellsForRole,
} from "@ddd-qc/lit-happ";
import { NamedIntegerDvm } from "./viewModels/integer";
import { NamedRealDvm } from "./viewModels/real";
import {AdminWebsocket} from "@holochain/client";

/** Import custom elements */
import "./elements/integer-list";
import "./elements/label-list";
import "./elements/real-list";
import "./elements/named-inspect";

/** TESTING Decorator for better init */
/** Doesn't solve our problem since our initializer is doing an async call */

interface IHapp {
  get appProxy(): AppProxy;
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
    super(Number(process.env.HC_APP_PORT));
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

  @state() private _initializedOffline = false;
  @state() private _initializedOnline = false;

  /** */
  async hvmConstructed(): Promise<void> {
    console.log("hvmConstructed()")
    /** Authorize all zome calls */
    const adminWs = await AdminWebsocket.connect(new URL(`ws://localhost:${process.env.HC_ADMIN_PORT}`));
    console.log({adminWs});
    await this.hvm.authorizeAllZomeCalls(adminWs);
    console.log("*** Zome call authorization complete");
  }


  /** */
  async perspectiveInitializedOffline(): Promise<void> {
    console.log("perspectiveInitializedOffline()")
    this._initializedOffline = true;
  }


  /** */
  async perspectiveInitializedOnline(): Promise<void> {
    console.log("perspectiveInitializedOnline()")
    this._initializedOnline = true;
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

    if (!this._initializedOffline) {
      return html`<span>Loading...</span>`;
    }

    const maybeImpostor = html`
      <cell-context .cell="${this.impostorDvm.cell}">
          <hr class="solid">
          <h2>
              Impostor Role: ${this.impostorDvm.hcl.toString()}
              <input type="button" value="dump logs" @click=${(e: any) => this.impostorDvm.dumpLogs()}>
          </h2>
          <real-list></real-list>
          <label-list></label-list>
      </cell-context>
    `;

    /** render all */
    return html`
      <div style="margin:10px;${this._initializedOnline? "" : "background:red;"}">
        <h2>${(this.constructor as any).HVM_DEF.id} App</h2>
        <input type="button" value="Probe hApp" @click=${this.onProbe}>
        <input type="button" value="Dump signals" @click=${(e:any) => {this.appProxy.dumpSignals()}}>
        <br/>
        <!-- SELECT ENTRY TYPE -->
        <span>Select AppEntryType:</span>
        <entry-def-select .dnaViewModel="${this.integerDvm}" @entrySelected=${this.onEntrySelect}></entry-def-select>
        <div style="margin:10px;">
            <span><span id="entryLabel">none</span></span>
        </div>
        <!-- INSPECTORS -->
        <hr class="solid">
        <cell-context .cell="${this.integerDvm.cell}">
            <named-integer-inspect></named-integer-inspect>
        </cell-context>
        <cell-context .cell="${this.realDvm.cell}">
            <named-real-inspect></named-real-inspect>
        </cell-context>
        <cell-context .cell="${this.impostorDvm.cell}">
            <named-real-inspect baseRoleName="rImpostor"></named-real-inspect>
        </cell-context>          
        <!-- Integer cell -->
        <hr class="solid">
        <cell-context .cell="${this.integerDvm.cell}">
            <h2>
                Integer Role: ${this.integerDvm.hcl.toString()}
                <input type="button" value="dump logs" @click=${(e: any) => this.integerDvm.dumpLogs()}>
            </h2>
            <integer-list></integer-list>
            <label-list></label-list>
        </cell-context>
        <!-- Real cell -->
        <cell-context .cell="${this.realDvm.cell}">
            <hr class="solid">
            <h2>
                Real Role: ${this.realDvm.hcl.toString()}
                <input type="button" value="dump logs" @click=${(e: any) => this.realDvm.dumpLogs()}>
            </h2>
            <real-list></real-list>
            <label-list></label-list>
        </cell-context>
        <!-- Impostor cell -->
        ${maybeImpostor}          
    `
  }


  // /** */
  // static get scopedElements() {
  //   return {
  //     "entry-def-select": EntryDefSelect,
  //     "named-integer-inspect": NamedIntegerInspect,
  //     "named-real-inspect": NamedRealInspect,
  //     "integer-list": IntegerList,
  //     "real-list": RealList,
  //     "label-list": LabelList,
  //     "cell-context": CellContext,
  //   };
  // }
}

//DummyApp.addInitializer(initializeHapp);
