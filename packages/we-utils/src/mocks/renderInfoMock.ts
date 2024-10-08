import {RenderInfo,  AppletView} from "@theweave/api";
import {AssetViewInfo, intoHrl} from "../index";
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
        hrl: intoHrl(DnaId.empty(), EntryId.empty()),
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
    // @ts-ignore
    appletClient: undefined,
    // @ts-ignore
    profilesClient: undefined,
    // @ts-ignore
    peerStatusStore: undefined,
    appletHash: EntryId.empty(42).hash,
    groupProfiles: [{name: "fakeGroup", icon_src: "https://lightningrodlabs.org/lrl_logo.png"}],
};
