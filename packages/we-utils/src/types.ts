import {
    AppletClients,
    CreatableName,
    CrossAppletView,
    RecordInfo,
    RenderInfo,
    WeaveServices
} from "@lightningrodlabs/we-applet";
import {HappElement} from "@ddd-qc/lit-happ";


export type CreateAppletFn = (renderInfo: RenderInfo, weServices: WeaveServices) => Promise<HappElement>;

export type CreateWeServicesMockFn = (devtestAppletId: EntryId) => Promise<WeaveServices>;

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
import {GroupProfile, ReadonlyPeerStatusStore, WAL} from "@lightningrodlabs/we-applet/dist/types";
import {AppClient, EntryHash} from "@holochain/client";
import {EntryId} from "@ddd-qc/cell-proxy";

export type AppletViewInfo = {
    type: "applet-view",
    view: AppletView,
    appletClient: AppClient,
    profilesClient: ProfilesClient,
    peerStatusStore: ReadonlyPeerStatusStore,
    appletHash: AppletHash,
    groupProfiles: GroupProfile[];
};
export type CrossViewInfo = {
    type: 'cross-applet-view';
    view: CrossAppletView;
    applets: ReadonlyMap<EntryHash, AppletClients>;
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
    wal: WAL,
    recordInfo?: RecordInfo;
}

/** */
export type CreatableViewInfo = {
    type: "creatable";
    name: CreatableName;
    resolve: (wal: WAL) => Promise<void>;
    reject: (reason: any) => Promise<void>;
    cancel: () => Promise<void>;
};
