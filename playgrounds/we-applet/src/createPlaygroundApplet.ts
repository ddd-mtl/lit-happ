import { AppWebsocket } from "@holochain/client";
import {
  RenderInfo,
  WeaveServices,
} from "@theweave/api";

import "@holochain-open-dev/profiles/dist/elements/profiles-context.js";

import {AppletViewInfo, ProfilesApi/*, CrossViewInfo*/} from "@ddd-qc/we-utils";
import {EntryId, ExternalAppProxy} from "@ddd-qc/cell-proxy/";
import {AgentId, destructureCloneId, HCL} from "@ddd-qc/lit-happ";
import {PlaygroundApp} from "playground";
import {ProfilesClient} from "@holochain-open-dev/profiles";


/** */
export async function createPlaygroundApplet(
  renderInfo: RenderInfo,
  weServices: WeaveServices,
): Promise<PlaygroundApp> {

  if (renderInfo.type =="cross-group-view") {
    throw Promise.reject("cross-applet-view not implemented by Files");
  }

  const appletViewInfo = renderInfo as unknown as AppletViewInfo;
  const profilesClient = appletViewInfo.profilesClient;

  console.log("createExampleApplet() client", appletViewInfo.appletClient);
  console.log("createExampleApplet() thisAppletId", appletViewInfo.appletHash);

  const mainAppInfo = await appletViewInfo.appletClient.appInfo();
  if (!mainAppInfo) {
    throw Promise.reject("No main appInfo found");
  }
  const agentId = new AgentId(mainAppInfo.agent_pub_key);
  console.log("createExampleApplet() mainAppInfo", mainAppInfo, agentId);

  //const showFileOnly = false; // FIXME

  /** Determine profilesAppInfo */
  const mainAppWs = appletViewInfo.appletClient as AppWebsocket;
  //const mainAppWs = mainAppAgentWs.appWebsocket;
  let profilesAppInfo = await profilesClient.client.appInfo();
  console.log("createExampleApplet() profilesAppInfo", profilesAppInfo, agentId);
  if (!profilesAppInfo) {
    throw Promise.reject("No profiles appInfo found");
  }
  /** Check if roleName is actually a cloneId */
  let maybeCloneId = undefined;
  let baseRoleName = profilesClient.roleName;
  const maybeBaseRoleName = destructureCloneId(profilesClient.roleName);
  if (maybeBaseRoleName) {
    baseRoleName = maybeBaseRoleName[0];
    maybeCloneId = profilesClient.roleName;
  }
  /** Determine profilesCellProxy */
  const hcl = new HCL(profilesAppInfo.installed_app_id, baseRoleName, maybeCloneId);
  const profilesApi = new ProfilesApi(profilesClient);
  console.log("createExampleApplet() profilesApi", profilesApi);
  const profilesAppProxy = new ExternalAppProxy(profilesApi, "", 10 * 1000);
  console.log("createExampleApplet() profilesAppProxy", profilesAppProxy);
  await profilesAppProxy.fetchCells(profilesAppInfo.installed_app_id, baseRoleName);
  const profilesCellProxy = await profilesAppProxy.createCellProxy(hcl);
  console.log("createExampleApplet() profilesCellProxy", profilesCellProxy);
  /** Create FilesApp */
  const app = await PlaygroundApp.fromWe(
    mainAppWs, undefined, false, mainAppInfo.installed_app_id,
    profilesAppInfo.installed_app_id, baseRoleName, maybeCloneId, profilesClient.zomeName, profilesAppProxy,
    weServices, new EntryId(appletViewInfo.appletHash), appletViewInfo.view, appletViewInfo.groupProfiles);
  console.log("createExampleApplet() app", app);
  /** Done */
  return app;

}



//
// /** */
// export async function createExampleApplet(renderInfo: RenderInfo, weServices: WeaveServices): Promise<LitElement> {
//   console.log("createExampleApplet() type:", renderInfo.type);
//   //let appletGroups: AppletGroup[] = [];
//   /** cross-group-view */
//   if (renderInfo.type == "cross-group-view") {
//     // const crossViewInfo = renderInfo as unknown as CrossViewInfo;
//     // //throw Error("cross-group-view not implemented by Vines");
//     // console.log("createExampleApplet() crossViewInfo", crossViewInfo);
//     // for (const [appletHash, appletClients] of crossViewInfo.applets.entries()) {
//     //   const appWs = appletClients.appletClient as unknown as AppWebsocket; // WARN not sure about "unknown"
//     //   const [profilesHcl, profilesAppProxy] = await createProfilesCellProxy(appletClients.profilesClient);
//     //   const appletGroup: AppletGroup = {
//     //     appWs,
//     //     appId: await getAppId(appWs),
//     //     appletId: new EntryId(appletHash),
//     //     profilesHcl,
//     //     profilesAppProxy,
//     //     appletView: crossViewInfo.view,
//     //   }
//     //   appletGroups.push(appletGroup);
//     // }
//   } else {
//     /** applet-view */
//     const appletViewInfo = renderInfo as unknown as AppletViewInfo;
//     console.log("createExampleApplet()         client", appletViewInfo.appletClient);
//     console.log("createExampleApplet() thisAppletHash", appletViewInfo.appletHash);
//
//     const appWs = appletViewInfo.appletClient as AppWebsocket;
//     const [profilesHcl, profilesAppProxy] = await createProfilesCellProxy(appletViewInfo.profilesClient);
//
//     // const appletGroup: AppletGroup = {
//     //   appWs,
//     //   appId: await getAppId(appWs),
//     //   appletId: new EntryId(appletViewInfo.appletHash),
//     //   profilesHcl,
//     //   profilesAppProxy,
//     //   appletView: appletViewInfo.view,
//     // }
//     //appletGroups = [appletGroup];
//   }
//
//   /** -- Create VinesApp -- */
//   const app = await VinesApp.fromWe(weServices, undefined, renderInfo.type == "cross-group-view", appletGroups);
//   return app;
// }


/** -- main App ID -- */
export async function getAppId(appWs: AppWebsocket) {
  const mainAppInfo = await appWs.appInfo();
  if (!mainAppInfo) {
    throw Promise.reject("Missing Main AppInfo");
  }
  console.log("createExampleApplet() mainAppInfo", mainAppInfo);
  return mainAppInfo.installed_app_id;
}



/** */
export async function createProfilesCellProxy(profilesClient: ProfilesClient): Promise<[HCL, ExternalAppProxy]> {
  /** -- ProfilesClient -- */
  const profilesAppInfo = await profilesClient.client.appInfo();
  console.log("createExampleApplet() profilesAppInfo", profilesAppInfo, profilesClient.roleName);
  if (!profilesAppInfo) {
    throw Promise.reject("Missing Profiles AppInfo");
  }
  /* Check if roleName is actually a cloneId */
  let maybeCloneId = undefined;
  let profilesBaseRoleName = profilesClient.roleName;
  const maybeBaseRoleName = destructureCloneId(profilesClient.roleName);
  if (maybeBaseRoleName) {
    profilesBaseRoleName = maybeBaseRoleName[0];
    maybeCloneId = profilesClient.roleName;
  }
  const profilesHcl = new HCL(profilesAppInfo.installed_app_id, profilesBaseRoleName, maybeCloneId);
  /* Create profilesCellProxy */
  const profilesApi = new ProfilesApi(profilesClient);
  const profilesAppProxy = new ExternalAppProxy(profilesApi, "", 10 * 1000);
  await profilesAppProxy.fetchCells(profilesAppInfo.installed_app_id, profilesBaseRoleName);
  const profilesCellProxy = await profilesAppProxy.createCellProxy(profilesHcl);
  console.log("createExampleApplet() profilesCellProxy", profilesCellProxy);

  return [profilesHcl, profilesAppProxy];
}

