import {RenderInfo,  AppletView} from "@theweave/api";
import {DnaId, EntryId} from "@ddd-qc/cell-proxy";
import {AssetViewInfo, intoHrl} from "../index";


/** Empty AppletViews */
export const emptyMainAppletView: AppletView = {
    type: "main"
};


// Weave dropped block views: AppletView in @theweave/api 0.7.0-dev.3 is only
// 'main' | 'asset' | 'creatable'. emptyBlockAppletView removed.


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

//console.debug("emptyEntryAppletView", emptyEntryAppletView);

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
    groupHash: null,
    // @ts-ignore
    profilesClient: undefined,
    // @ts-ignore
    peerStatusStore: undefined,
    appletHash: EntryId.empty(42).hash,
    groupProfiles: [{name: "fakeGroup", icon_src: "https://lightningrodlabs.org/lrl_logo.png"}],
};
