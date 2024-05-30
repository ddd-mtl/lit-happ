import {RenderInfo,  AppletView} from "@lightningrodlabs/we-applet";
import {fakeDnaHash, fakeEntryHash} from "@holochain/client";
import {AppletViewInfo, AssetViewInfo} from "../index";
import {AppletHash, ReadonlyPeerStatusStore} from "@lightningrodlabs/we-applet/dist/types";


/** Empty AppletViews */
export const emptyMainAppletView = {
    type: "main"
} as AppletView;


export const emptyBlockAppletView = {
    type: "block",
    block: "",
    context: null,
} as AppletView;

export const emptyEntryAppletView = {
    type: "asset",
    roleName: "",
    integrityZomeName: "",
    entryType: "",
    wal: {
        hrl: [await fakeDnaHash(), await fakeEntryHash()],
        context: null,
    },
} as AssetViewInfo;



/**  Empty RenderInfo */
// export const emptyAppletView: AppletViewInfo = {
//     type: "applet-view",
//     view: emptyMainAppletView,
//     appletClient: undefined,
//     profilesClient: undefined,
//     appletHash: await fakeEntryHash() as AppletHash,
//     groupProfiles: [{name: "fakeGroup", logo_src: "https://lightningrodlabs.org/lrl_logo.png"}],
// }

/** */
export const emptyRenderInfo: RenderInfo = {
    type: "applet-view",
    view: emptyMainAppletView,
    appletClient: undefined,
    profilesClient: undefined,
    peerStatusStore: undefined,
    appletHash: await fakeEntryHash() as AppletHash,
    groupProfiles: [{name: "fakeGroup", icon_src: "https://lightningrodlabs.org/lrl_logo.png"}],
};
