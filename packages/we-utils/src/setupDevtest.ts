import {LitElement} from "lit";
import { setBasePath, getBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import {
  AdminWebsocket,
  Record,
  AppWebsocket,
  ListAppsResponse, CellId, ProvisionedCell, CellType, AgentPubKeyMap,
} from "@holochain/client";
import { ProfilesClient } from '@holochain-open-dev/profiles';
import { ProfilesZomeMock } from "@holochain-open-dev/profiles/dist/mocks.js";
import {AppletView, RenderInfo} from "@theweave/api";
import {DnaId, EntryId} from "@ddd-qc/lit-happ";
import {CreateAppletFn, CreateWeServicesMockFn, DevTestNames} from "./types";
import {emptyRenderInfo} from "./mocks/renderInfoMock";
import {AppletViewInfo} from "./index";


/** */
export class ProfilesZomeMockFix extends ProfilesZomeMock {
    override get cellId() {
        return [
            DnaId.empty(112).hash,
            this.myPubKey,
        ] as CellId;
    }
}


/** */
export async function setupDevtest(
  createApplet: CreateAppletFn,
  names: DevTestNames,
  createWeServicesMock: CreateWeServicesMockFn,
  appletView?: AppletView,
  ): Promise<LitElement> {
    console.debug("[we-utils] setupDevtest()", process.env.HAPP_BUILD_MODE, process.env.HC_APP_PORT, process.env.HC_ADMIN_PORT);

    setBasePath('../../node_modules/@shoelace-style/shoelace/dist');
    console.log("shoelace basePath", getBasePath());

    const localStorageId = names.installed_app_id + "-id";

    /** Store AppletId in LocalStorage, so we can retrieve it when refreshing webpage */
    let devtestAppletId: EntryId;
    let devtestAppletIdB64 = window.localStorage[localStorageId];
    if (!devtestAppletIdB64) {
        devtestAppletId = await EntryId.random();
        window.localStorage[localStorageId] = devtestAppletId.b64;
    } else {
        devtestAppletId = new EntryId(devtestAppletIdB64);
    }
    console.debug("[we-utils] setupDevtest() devtestAppletId", devtestAppletId);

    /** Create custom WeServiceMock */
    const myWeServicesMock = await createWeServicesMock(devtestAppletId);

    /** AdminWebsocket */
    let mainCellId: CellId | undefined = undefined;
    const adminWs = await AdminWebsocket.connect({url: new URL(`ws://localhost:${process.env.HC_ADMIN_PORT}`)});
    const apps: ListAppsResponse = await adminWs.listApps({});
    console.debug("[we-utils] setupDevtest() apps", apps);
    if (apps.length == 0) {
        throw Promise.reject("Empty Apps list");
    }
    const issued = await adminWs.issueAppAuthenticationToken({installed_app_id: apps[0]!.installed_app_id});
    const token = issued.token;

    /** AppWebsocket */
    const appAgentWs = await AppWebsocket.connect( {url: new URL(`ws://localhost:${process.env.HC_APP_PORT}`), token});
    console.debug("[we-utils] appAgentWs", appAgentWs);
    const appInfo = await appAgentWs.appInfo();
    console.debug("[we-utils] appInfo", appInfo);

    /** Authorize Zome functions */
    for (const [roleName, cells] of Object.entries(appInfo.cell_info)) {
        for (const cell of cells) {
            let cellId: CellId;
            if (CellType.Provisioned == cell.type) {
                cellId = (cell.value as ProvisionedCell).cell_id;
                if (roleName == names.provisionedRoleName) {
                    mainCellId = cellId;
                }
            } else {
                continue;
            }
            await adminWs.authorizeSigningCredentials(cellId);
        }
    }

    if (!mainCellId) {
        throw Promise.reject("No main cell found");
    }
    /** Creating mock lobby app with profiles dna & zome */
    const mockProfilesZome = new ProfilesZomeMockFix(new AgentPubKeyMap<Record>(), mainCellId[1]);
    //console.log("mock agentId", mockProfilesZome.myPubKey);
    //mockProfilesZome.myPubKey = mainCellId[1];
    //console.log("mock agentId", encodeHashToBase64(mockProfilesZome.myPubKey));
    mockProfilesZome.create_profile({input: {nickname: "Alex", fields: {lang:"en"}}})
    const mockAppInfo = await mockProfilesZome.appInfo();
    console.log("setupDevtest() mockAppInfo", mockAppInfo);


    /** Create renderInfo */
    let renderInfo= emptyRenderInfo as unknown as AppletViewInfo;
    renderInfo.profilesClient = new ProfilesClient((mockProfilesZome as any), /*mockProfilesZome.roleName*/ "lobby");
    renderInfo.appletClient = appAgentWs;
    renderInfo.appletHash = devtestAppletId.hash;
    console.log("setupDevtest() renderInfo", renderInfo);
    /** Determine renderInfo.view */
    if (appletView) {
        renderInfo.view = appletView;
    }
    /** Create Applet */
    const applet = await createApplet(renderInfo as unknown as RenderInfo, myWeServicesMock);
    //renderers.main(document.body);
    console.log("setupDevtest() applet", applet);
    return applet;
}
