import {RenderInfo, WeServices} from "@lightningrodlabs/we-applet";
import {HappElement} from "@ddd-qc/lit-happ";


export type CreateAppletFn = (renderInfo: RenderInfo, weServices: WeServices) => Promise<HappElement>;

export type CreateWeServicesMockFn = (devtestAppletId: string) => Promise<WeServices>;

export interface DevTestNames {
    installed_app_id: string,
    provisionedRoleName: string,
}

//----------------------------------------------------------------------------------------------------------------------
// RenderInfo types
// WARN keep in sync with "@lightningrodlabs/we-applet" types
//----------------------------------------------------------------------------------------------------------------------

import {AppletHash, AppletView} from "@lightningrodlabs/we-applet";
import {ProfilesClient} from "@holochain-open-dev/profiles";
import {AppAgentClient} from "@holochain/client";
import {GroupProfile, Hrl} from "@lightningrodlabs/we-applet/dist/types";

export type AppletViewInfo = {
    type: "applet-view",
    view: AppletView,
    appletClient: AppAgentClient,
    profilesClient: ProfilesClient,
    appletHash: AppletHash,
    groupProfiles: GroupProfile[];
};


export type EntryViewInfo = {
    type: "entry",
    roleName: string,
    integrityZomeName: string,
    entryType: string,
    hrl: Hrl,
    context: any,
}


export type BlockViewInfo = {
    type: "block";
    block: string;
    context: any;
}
