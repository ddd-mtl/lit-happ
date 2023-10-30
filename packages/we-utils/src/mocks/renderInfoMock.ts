import {RenderInfo,  AppletView} from "@lightningrodlabs/we-applet";
import {fakeDnaHash, fakeEntryHash} from "@holochain/client";
import {AppletViewInfo} from "../index";


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
    type: "entry",
    roleName: "",
    integrityZomeName: "",
    entryType: "",
    hrl: [await fakeDnaHash(), await fakeEntryHash()],
    context: null,
} as AppletView;



/**  Empty RenderInfo */
export const emptyAppletView: AppletViewInfo = {
    type: "applet-view",
    view: emptyMainAppletView,
    appletClient: undefined,
    profilesClient: undefined,
    appletHash: await fakeEntryHash(),
}

/** */
export const emptyRenderInfo: RenderInfo = emptyAppletView;
