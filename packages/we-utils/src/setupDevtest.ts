import {
    AdminWebsocket,
    Record,
    AppWebsocket,
    ListAppsResponse, CellId,
} from "@holochain/client";
import { ProfilesClient } from '@holochain-open-dev/profiles';
import { ProfilesZomeMock } from "@holochain-open-dev/profiles/dist/mocks.js";
import { setBasePath, getBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import {DnaId, EntryId, HappElement} from "@ddd-qc/lit-happ";
import {CreateAppletFn, CreateWeServicesMockFn, DevTestNames} from "./types";
import {emptyRenderInfo} from "./mocks/renderInfoMock";
import {AppletViewInfo} from "./index";
import {AppletView, RenderInfo} from "@lightningrodlabs/we-applet";
import {AgentPubKeyMap} from "@holochain-open-dev/utils";

export class ProfilesZomeMockFix extends ProfilesZomeMock {
    get cellId() {
        return [
            DnaId.empty(112).hash,
            this.myPubKey,
        ] as CellId;
    }

}


/** */
export async function setupDevtest(createApplet: CreateAppletFn, names: DevTestNames, createWeServicesMock: CreateWeServicesMockFn, appletView?: AppletView)
    : Promise<HappElement> {
    console.log("setupDevtest()", process.env.HAPP_BUILD_MODE, process.env.HC_APP_PORT, process.env.HC_ADMIN_PORT);

    setBasePath('../../node_modules/@shoelace-style/shoelace/dist');
    console.log("shoelace basePath", getBasePath());

    const localStorageId = names.installed_app_id + "-id";

    /** Store AppletId in LocalStorage, so we can retrieve it when refereshing webpage */
    let devtestAppletId: EntryId;
    let devtestAppletIdB64 = window.localStorage[localStorageId];
    if (!devtestAppletIdB64) {
        devtestAppletId = await EntryId.random();
        window.localStorage[localStorageId] = devtestAppletId.b64;
    } else {
        devtestAppletId = new EntryId(devtestAppletIdB64);
    }
    console.log("setupDevtest() devtestAppletId", devtestAppletId);

    /** Create custom WeServiceMock */
    const myWeServicesMock = await createWeServicesMock(devtestAppletId);

    /** AdminWebsocket */
    let mainCellId;
    const adminWs = await AdminWebsocket.connect({url: new URL(`ws://localhost:${process.env.HC_ADMIN_PORT}`)});
    const apps: ListAppsResponse = await adminWs.listApps({});
    console.log("setupDevtest() apps", apps);
    const issued = await adminWs.issueAppAuthenticationToken({installed_app_id: apps[0].installed_app_id});
    const token = issued.token;


    /** AppWebsocket */
    const appAgentWs = await AppWebsocket.connect( {url: new URL(`ws://localhost:${process.env.HC_APP_PORT}`), token});
    console.log("appAgentWs", appAgentWs);
    const appInfo = await appAgentWs.appInfo();
    console.log("appInfo", appInfo);

    /** Authorize Zome functions */
    for (const [roleName, cells] of Object.entries(appInfo.cell_info)) {
        for (const cell of cells) {
            let cellId;
            if ("provisioned" in cell) {
                cellId = cell.provisioned.cell_id;
                if (roleName == names.provisionedRoleName) {
                    mainCellId = cellId;
                }
            } else {
                continue;
            }
            await adminWs.authorizeSigningCredentials(cellId);
        }
    }

    /** Creating mock lobby app with profiles dna & zome */
    const mockProfilesZome = new ProfilesZomeMockFix(new AgentPubKeyMap<Record>(), mainCellId[1]);
    //console.log("mock agentId", mockProfilesZome.myPubKey);
    //mockProfilesZome.myPubKey = mainCellId[1];
    //console.log("mock agentId", encodeHashToBase64(mockProfilesZome.myPubKey));
    mockProfilesZome.create_profile({nickname: "Alex", fields: {lang:"en"}})
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
