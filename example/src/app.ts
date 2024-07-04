import { html } from "lit";
import { state } from "lit/decorators.js";
import {
  HvmDef,
  HappElement, EntryId, AgentId,
} from "@ddd-qc/lit-happ";
import { NamedIntegerDvm } from "./viewModels/integer";
import { NamedRealDvm } from "./viewModels/real";

/** Import custom elements */
import "./elements/integer-list";
import "./elements/label-list";
import "./elements/real-list";
import "./elements/named-inspect";
import {ProfilesAltDvm} from "@ddd-qc/profiles-dvm/dist/profilesAlt.dvm";


/**
 *
 */
export class PlaygroundApp extends HappElement {

  /** Ctor */
  constructor() {
    super(Number(process.env.HC_APP_PORT), undefined,  new URL(`ws://localhost:${process.env.HC_ADMIN_PORT}`));
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
      },
      {
        ctor: ProfilesAltDvm,
        isClonable: false,
      },
    ],
  };


  /** QoL */
  get integerDvm(): NamedIntegerDvm { return this.hvm.getDvm(NamedIntegerDvm.DEFAULT_BASE_ROLE_NAME)! as NamedIntegerDvm }
  get impostorDvm(): NamedRealDvm { return this.hvm.getDvm("rImpostor")! as NamedRealDvm }
  get realDvm(): NamedRealDvm { return this.hvm.getDvm(NamedRealDvm.DEFAULT_BASE_ROLE_NAME)! as NamedRealDvm }

  get profilesDvm(): ProfilesAltDvm { return this.hvm.getDvm(ProfilesAltDvm.DEFAULT_BASE_ROLE_NAME)! as ProfilesAltDvm }


  @state() private _selectedZomeName = ""

  @state() private _initializedOffline = false;
  @state() private _initializedOnline = false;


  /** */
  async hvmConstructed(): Promise<void> {
    console.log("hvmConstructed()", this.profilesDvm.cell.agentId);
    //await this.profilesDvm.profilesZvm.createMyProfile({nickname: "Camille", fields: {}});
    const maybeMyProfile = await this.profilesDvm.profilesZvm.getMyProfile();
    console.log("maybeProfile", maybeMyProfile);
    const maybeProfile = await this.profilesDvm.profilesZvm.findProfile(this.profilesDvm.cell.agentId);
    console.log("maybeProfile", maybeProfile);
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
              <input type="button" value="dump calls" @click=${(e: any) => this.impostorDvm.dumpCallLogs()}>
              <input type="button" value="dump signals" @click=${(e: any) => this.impostorDvm.dumpSignalLogs()}>
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
        <input type="button" value="Dump signals" @click=${(e:any) => {this.appProxy.dumpSignalLogs(true)}}>
        <input type="button" value="networkInfos" @click=${async (e:any) => {await this.networkInfoAll(); this.dumpLastestNetworkInfo(); this.dumpNetworkInfoLogs()}}>
        <br/>
        <!-- SELECT ENTRY TYPE -->
        <div style="margin-top: 5px;">
          <dvm-inspect .dnaViewModel=${this.integerDvm}></dvm-inspect>
          <span>Select AppEntryType:</span>
          <entry-def-select .dnaViewModel=${this.integerDvm} @entrySelected=${this.onEntrySelect}></entry-def-select>
        </div>
        <div style="margin:10px;">
            <span><span id="entryLabel">none</span></span>
        </div>
        <!-- INSPECTORS -->
        <hr class="solid">
        <cell-context .cell=${this.integerDvm.cell}>
            <named-integer-inspect></named-integer-inspect>
        </cell-context>
        <cell-context .cell=${this.realDvm.cell}>
            <named-real-inspect></named-real-inspect>
        </cell-context>
        <cell-context .cell=${this.impostorDvm.cell}>
            <named-real-inspect baseRoleName="rImpostor"></named-real-inspect>
        </cell-context>          
        <!-- Integer cell -->
        <hr class="solid">
        <cell-context .cell=${this.integerDvm.cell}>
            <h2>
                Integer Role: ${this.integerDvm.hcl.toString()}
                <input type="button" value="dump calls" @click=${(e: any) => this.integerDvm.dumpCallLogs()}>
                <input type="button" value="dump signals" @click=${(e: any) => this.integerDvm.dumpSignalLogs()}>
            </h2>
            <integer-list></integer-list>
            <label-list></label-list>
        </cell-context>
        <!-- Real cell -->
        <cell-context .cell=${this.realDvm.cell}>
            <hr class="solid">
            <h2>
                Real Role: ${this.realDvm.hcl.toString()}
                <input type="button" value="dump calls" @click=${(e: any) => this.realDvm.dumpCallLogs()}>
                <input type="button" value="dump signals" @click=${(e: any) => this.realDvm.dumpSignalLogs()}>
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
