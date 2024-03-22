import {CreatableName, RenderInfo, WeServices} from "@lightningrodlabs/we-applet";
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
import {GroupProfile, WAL} from "@lightningrodlabs/we-applet/dist/types";

export type AppletViewInfo = {
    type: "applet-view",
    view: AppletView,
    appletClient: AppAgentClient,
    profilesClient: ProfilesClient,
    appletHash: AppletHash,
    groupProfiles: GroupProfile[];
};


/** */
export type BlockViewInfo = {
    type: "block";
    block: string;
    context: any;
}

/** */
export type AssetViewInfo = {
    type: "asset",
    roleName: string,
    integrityZomeName: string,
    entryType: string,
    wal: WAL,
}

/** */
export type CreatableViewInfo = {
    type: "creatable";
    name: CreatableName;
    resolve: (wal: WAL) => Promise<void>;
    reject: (reason: any) => Promise<void>;
    cancel: () => Promise<void>;
};
