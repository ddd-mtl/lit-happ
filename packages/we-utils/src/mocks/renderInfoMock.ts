import {RenderInfo,  AppletView} from "@lightningrodlabs/we-applet";
import {AppletViewInfo, AssetViewInfo} from "../index";
import {AppletHash, ReadonlyPeerStatusStore} from "@lightningrodlabs/we-applet/dist/types";
import {DnaId, EntryId} from "@ddd-qc/cell-proxy";


/** Empty AppletViews */
export const emptyMainAppletView: AppletView = {
    type: "main"
};


export const emptyBlockAppletView: AppletView = {
    type: "block",
    block: "",
    context: null,
};

export const emptyEntryAppletView: AssetViewInfo = {
    type: "asset",
    wal: {
        hrl: [DnaId.empty().hash, EntryId.empty().hash],
        context: null,
    },
    recordInfo: {
        roleName: "",
        integrityZomeName: "",
        entryType: "",
    },
};



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
    appletHash: EntryId.empty(42).hash as AppletHash,
    groupProfiles: [{name: "fakeGroup", icon_src: "https://lightningrodlabs.org/lrl_logo.png"}],
};
