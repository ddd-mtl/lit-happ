import {AppletServices, WeaveClient} from "@lightningrodlabs/we-applet";
import {setBasePath, getBasePath} from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import {delay, HappElement, HAPP_ENV, HappEnvType} from "@ddd-qc/lit-happ";
import {setupDevtest} from "./setupDevtest";
import {createDefaultWeServicesMock} from "./mocks/weServicesMock";
import {CreateAppletFn, CreateWeServicesMockFn, DevTestNames} from "./types";



/** */
export async function setup(appletServices: AppletServices, createApplet: CreateAppletFn, devtestNames: DevTestNames, createWeServicesMock?: CreateWeServicesMockFn): Promise<HappElement> {
    //console.log("HAPP_ENV", HAPP_ENV);
    if (HAPP_ENV == HappEnvType.DevtestWe) {
        return setupDevtest(createApplet, devtestNames, createWeServicesMock? createWeServicesMock : createDefaultWeServicesMock);
    } else {
        return setupProd(appletServices, createApplet);
    }
}


/** */
export async function setupProd(appletServices: AppletServices, createApplet: CreateAppletFn): Promise<HappElement> {
    //console.log("setup()");
    setBasePath('./');
    //console.log("shoelace basePath", getBasePath());
    //console.log("WeClient.connect()...", WeClient);
    const weClient = await WeaveClient.connect(appletServices);
    //console.log("weClient", weClient);
    if (weClient.renderInfo.type != "applet-view") {
        console.error("Setup called for non 'applet-view' type")
        return;
    }

    /** Delay because of We 'CellDisabled' bug at startup race condition */
    await delay(1000);

    //const renderInfo = weClient.renderInfo as any;
    const applet = await createApplet(weClient.renderInfo, weClient);
    //console.log("applet", applet);
    return applet;
}
