import { html } from "lit";
import {state} from "lit/decorators.js";
import {ContextProvider, createContext} from "@lit/context";
import {
  HvmDef,
  HappElement, BaseRoleName, CloneId, AppProxy, EntryId, DnaViewModel, HCL, DvmDef,
} from "@ddd-qc/lit-happ";
import { NamedIntegerDvm } from "./viewModels/integer";
import { NamedRealDvm } from "./viewModels/real";
import {Profile, ProfilesAltDvm, ProfilesDvm} from "@ddd-qc/profiles-dvm";
import {testHoloId} from "@ddd-qc/cell-proxy"
import {
  NetworkMetrics,
  AdminWebsocket,
  AppWebsocket, InstalledAppId, ZomeName,
} from "@holochain/client";

/** Import custom elements */
import "./elements/integer-list";
import "./elements/label-list";
import "./elements/real-list";
import "./elements/named-inspect";
import "@ddd-qc/profiles-dvm/dist/elements/edit-profile";

import {HC_ADMIN_PORT, HC_APP_PORT} from "./globals";

import {AppletId, AppletView, GroupProfile, WeaveServices} from "@theweave/api";
import {GetStrategy} from "@holochain-open-dev/core-types";
const weClientContext = createContext<WeaveServices>('weave_client');

/** */
export class PlaygroundApp extends HappElement {

  //@state() private _hasWeProfile = false;

  /** Ctor */
  // @ts-ignore
  constructor(appWs?: AppWebsocket, private adminWs?: AdminWebsocket, readonly appId?: InstalledAppId, public _appletView?: AppletView) {
    console.log("PlaygroundApp.ctor()", HC_ADMIN_PORT, HC_APP_PORT, appWs, adminWs, appId);
    const adminUrl = adminWs
      ? undefined
      : HC_ADMIN_PORT
        ? new URL(`ws://localhost:${HC_ADMIN_PORT}`)
        : undefined;
    let appPort = HC_APP_PORT;
    //super(Number(process.env.HC_APP_PORT), undefined,  new URL(`ws://localhost:${process.env.HC_ADMIN_PORT}`));
    console.log("PlaygroundApp.ctor() adminUrl", adminUrl);
    super(appWs ? appWs : appPort!, appId, adminUrl, 20 * 1000);

    console.log("PlaygroundApp.HVM_DEF", PlaygroundApp.HVM_DEF);
    // if (_canAuthorizeZfns == undefined) {
    //   this._canAuthorizeZfns = true;
    // }
  }


  /** -- We-applet specifics -- */

  private _weProfilesDvm?: ProfilesDvm;
  protected _weProvider?: unknown; // FIXME type: ContextProvider<this.getContext()> ?

  public appletId?: AppletId;
  public groupProfiles?: GroupProfile[];
  // protected _attachmentsProvider?: unknown;


  /**  */
  static async fromWe(
    appWs: AppWebsocket,
    adminWs: AdminWebsocket | undefined,
    _canAuthorizeZfns: boolean,
    appId: InstalledAppId,
    profilesAppId: InstalledAppId,
    profilesBaseRoleName: BaseRoleName,
    profilesCloneId: CloneId | undefined,
    profilesZomeName: ZomeName,
    profilesProxy: AppProxy,
    weServices: WeaveServices,
    thisAppletHash: EntryId,
    //showEntryOnly?: boolean,
    appletView: AppletView,
    groupProfiles: GroupProfile[],
  ) : Promise<PlaygroundApp> {
    const app = new PlaygroundApp(appWs, adminWs, appId, appletView);
    /** Provide it as context */
    console.log(`\t\tProviding context "${weClientContext}" | in host `, app);
    app._weProvider = new ContextProvider(app, weClientContext, weServices);
    app.appletId = thisAppletHash.b64;
    app.groupProfiles = groupProfiles;
    /** Create Profiles Dvm from provided AppProxy */
    console.log("<playground-app>.ctor()", profilesProxy);
    await app.createWeProfilesDvm(profilesProxy, profilesAppId, profilesBaseRoleName, profilesCloneId, profilesZomeName);
    return app;
  }


  /** Create a Profiles DVM out of a different happ */
  async createWeProfilesDvm(profilesProxy: AppProxy, profilesAppId: InstalledAppId, profilesBaseRoleName: BaseRoleName,
                            profilesCloneId: CloneId | undefined,
                            _profilesZomeName: ZomeName): Promise<void> {
    const profilesAppInfo = await profilesProxy.appInfo();
    if (!profilesAppInfo) {
      throw Promise.reject("Profiles AppInfo not found");
    }
    const profilesDef: DvmDef = {ctor: ProfilesDvm, baseRoleName: profilesBaseRoleName, isClonable: false};
    const cell_infos = Object.values(profilesAppInfo.cell_info);
    console.log("createProfilesDvm() cell_infos:", cell_infos);
    /** Create Profiles DVM */
      //const profilesZvmDef: ZvmDef = [ProfilesZvm, profilesZomeName];
    const dvm: DnaViewModel = new profilesDef.ctor(this, profilesProxy, new HCL(profilesAppId, profilesBaseRoleName, profilesCloneId), false);
    console.log("createProfilesDvm() dvm", dvm);
    console.log("createProfilesDvm() profilesAppInfo", profilesAppInfo);
    await this.setupWeProfilesDvm(dvm as ProfilesDvm);
  }


  /** */
  async setupWeProfilesDvm(dvm: ProfilesDvm): Promise<void> {
    this._weProfilesDvm = dvm as ProfilesDvm;
    /** Load My profile */
      //const maybeProfiles = await this._weProfilesDvm.profilesZvm.zomeProxy.getAgentsWithProfile();
      //const maybeAgents = maybeProfiles.map((eh) => encodeHashToBase64(eh));
      //console.log("maybeAgents", maybeAgents);
    const maybeMyProfile = await this._weProfilesDvm.profilesZvm.probeProfile(dvm.profilesZvm.cell.address.agentId.b64);
    console.log("setupWeProfilesDvm() maybeMyProfile", maybeMyProfile);
    if (maybeMyProfile) {
      const maybeLang = maybeMyProfile.fields['lang'];
      if (maybeLang) {
        console.log("Setting locale from We Profile", maybeLang);
        //setLocale(maybeLang);
      }
      //this._hasWeProfile = true;
    }
    // else {
    //   /** Create Guest profile */
    //   const profile = { nickname: "guest_" + Math.floor(Math.random() * 100), fields: {}};
    //   console.log("setupWeProfilesDvm() createMyProfile", this.filesDvm.profilesZvm.cell.agentId);
    //   await this.filesDvm.profilesZvm.createMyProfile(profile);
    // }
  }


  /** HvmDef */
  static override HVM_DEF: HvmDef = {
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


  //@state() private _selectedZomeName = ""

  @state() private _initializedOffline = false;
  @state() private _initializedOnline = false;


  /** */
  override async hvmConstructed(): Promise<void> {
    console.log("hvmConstructed()", this.profilesDvm.cell.address.agentId);
    //await this.profilesDvm.profilesZvm.createMyProfile({nickname: "Camille", fields: {}});
    const maybeMyProfile = await this.profilesDvm.profilesZvm.getMyProfile();
    console.log("maybeProfile", maybeMyProfile);
    // const maybeProfile = await this.profilesDvm.profilesZvm.findProfile(this.profilesDvm.cell.agentId);
    // console.log("maybeProfile", maybeProfile);
    this.profilesDvm.profilesZvm.findProfile(this.profilesDvm.cell.address.agentId).then((maybeProfile: Profile | undefined) => {
      console.log("maybeProfile", maybeProfile);
      this.requestUpdate();
    })
  }


  /** */
  override async perspectiveInitializedFromLocal(): Promise<void> {
    console.log("perspectiveInitializedFromLocal()")
    this._initializedOffline = true;
  }


  /** */
  override async perspectiveInitializedFromNetwork(): Promise<void> {
    console.log("perspectiveInitializedFromNetwork()")
    this._initializedOnline = true;
  }


    override firstUpdated() {
        super.firstUpdated();
        this.networkCaller!.setCellAddr(this.profilesDvm.cell.address);
    }


    /** */
  async onProbe(_e: any) {
    //let entryDefs = await this.dummyDvm.fetchAllEntryDefs();
    //console.log({entryDefs})
    this.hvm.probeAll(GetStrategy.Local);
  }


  /** */
  async onEntrySelect(e: any) {
    //console.log("onEntrySelect() CALLED", e)
    const label = this.shadowRoot!.getElementById("entryLabel") as HTMLElement;
    label.innerText = JSON.stringify(e.detail);
  }


  /** */
  override render() {
    const myProfile = this.profilesDvm.profilesZvm.getMyProfile();
    console.log("<playground-app> render()", myProfile, this.hvm);
    testHoloId();

    if (!this._initializedOffline) {
      return html`<span>Loading...</span>`;
    }

    const maybeImpostor = html`
      <cell-context .cell="${this.impostorDvm.cell}">
          <hr class="solid">
          <h2>
              Impostor Role: ${this.impostorDvm.hcl.toString()}
              <input type="button" value="dump calls" @click=${(_e: any) => this.impostorDvm.dumpCallLogs()}>
              <input type="button" value="dump signals" @click=${(_e: any) => this.impostorDvm.dumpSignalLogs()}>
          </h2>
          <real-list></real-list>
          <label-list></label-list>
      </cell-context>
    `;

    /** render all */
    return html`
      <div style="margin:10px;${this._initializedOnline? "" : "background:red;"}">
        <h2>Lit-happ ${(this.constructor as any).HVM_DEF.id} App</h2>
        <input type="button" value="Probe hApp" @click=${this.onProbe}>
        <input type="button" value="Dump signals" @click=${(_e:any) => {this.appProxy.dumpSignalLogs(true)}}>
        <input type="button" value="Loop networkInfos" @click=${async (_e:any) => {
          console.log("networkInfos:", this.networkCaller?.isLooping(), this.networkCaller, this.integerDvm.cell.address)
            this.networkCaller?.setCellAddr(this.integerDvm.cell.address)
            if (!this.networkCaller?.isLooping()) {
                console.log("Start loop");
                this.networkCaller?.addCallback((info: NetworkMetrics) => {console.log(info)})
                await this.networkCaller?.startCallLoop(100);
            } else {
                this.networkCaller?.stopCallLoop();
                this.networkCaller?.clearAllCallbacks();
            }
        }}>
        <input type="button" value="Dump networkMetrics" @click=${(_e:any) => {this.networkCaller?.dumpNetworkMetricsLogs();}}>
        <input type="button" value="Dump networkStats" @click=${(_e:any) => {this.networkCaller?.dumpNetworkStatsLogs();}}>
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
                <input type="button" value="dump calls" @click=${(_e: any) => this.integerDvm.dumpCallLogs()}>
                <input type="button" value="dump signals" @click=${(_e: any) => this.integerDvm.dumpSignalLogs()}>
            </h2>
            <integer-list></integer-list>
            <label-list></label-list>
        </cell-context>
        <!-- Real cell -->
        <cell-context .cell=${this.realDvm.cell}>
            <hr class="solid">
            <h2>
                Real Role: ${this.realDvm.hcl.toString()}
                <input type="button" value="dump calls" @click=${(_e: any) => this.realDvm.dumpCallLogs()}>
                <input type="button" value="dump signals" @click=${(_e: any) => this.realDvm.dumpSignalLogs()}>
            </h2>
            <real-list></real-list>
            <label-list></label-list>
        </cell-context>
        <!-- Impostor cell -->
        ${maybeImpostor}
        <!-- Profiles cell -->
        <cell-context .cell=${this.profilesDvm.cell}>
            <hr class="solid">
            <h2>
                Profiles Role: ${this.profilesDvm.hcl.toString()}
                <input type="button" value="dump calls" @click=${(_e: any) => this.profilesDvm.dumpCallLogs()}>
                <input type="button" value="dump signals" @click=${(_e: any) => this.profilesDvm.dumpSignalLogs()}>
                <input type="button" value="export" @click=${(_e: any) => {
                  const json = this.profilesDvm.exportPerspective();
                  this.downloadTextFile("dump_profiles.json", json);
                }}>
                <input type="button" value="import only" @click=${(_e: any) => this.importDvm(false)}>
                <input type="button" value="import & publish" @click=${(_e: any) => this.importDvm(true)}>
            </h2>
            <profiles-edit-profile 
                    .profile=${myProfile}
                    @save-profile=${(e: CustomEvent<Profile>) => this.onSaveProfile(e.detail)}
                    @lang-selected=${(e: CustomEvent) => {
                        console.log("set locale", e.detail);
                        //setLocale(e.detail)
                    }}
            ></profiles-edit-profile>
        </cell-context>
    `
  }


  /** */
  downloadTextFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }


  /** */
  private importDvm(canPublish: boolean) {
    console.log("importDvm()");
    //console.log("<store-dialog> localOnly", localOnly, this._localOnly);
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = ".json";
    input.onchange = async (e:any) => {
      console.log("onImport() target download file", e);
      const file = e.target.files[0];
      if (!file) {
        console.error("No file selected");
        return;
      }
      const reader = new FileReader();
      reader.onload = (_e) => {
        const contents = reader.result as string;
        //console.log(contents);
        this.profilesDvm.importPerspective(contents, canPublish);
      };
      // Read the file as text
      reader.readAsText(file);
    }
    input.click();
  }


  /** */
  private async onSaveProfile(profile: Profile) {
    console.log("onSaveProfile()", profile);
    try {
      await this.profilesDvm.profilesZvm.updateMyProfile(profile);
    } catch(e) {
      await this.profilesDvm.profilesZvm.createMyProfile(profile);
    }
  }
}

