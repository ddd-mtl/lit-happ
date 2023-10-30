export * from "./cellUtils"
export * from "./profilesApi"
export * from "./setup"
export * from "./setupDevtest"
export * from "./types"

export * from "./mocks/profilesMock"
export * from "./mocks/weServicesMock"


//----------------------------------------------------------------------------------------------------------------------

import {AppletHash, AppletView} from "@lightningrodlabs/we-applet";
import {ProfilesClient} from "@holochain-open-dev/profiles";
import {AppAgentClient} from "@holochain/client";

export type AppletViewInfo = {
    type: "applet-view",
    view: AppletView,
    appletClient: AppAgentClient,
    profilesClient: ProfilesClient,
    appletHash: AppletHash,
};
