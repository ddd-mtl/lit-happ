
/** */
export enum HappEnvType {
    Prod        = "Prod",        // default value
    Devtest     = "Devtest",     // HAPP_ENV set to this by web-dev-server
    Electron    = "Electron",    // if window.electronBridge is defined
    DevtestWe   = "DevtestWe",   // HAPP_ENV set to this by web-dev-server
    We          = "We",          // if window.IN_WE defined
    DevTestHolo = "DevTestHolo", // HAPP_ENV set to this by web-dev-server
    Holo        = "HoloProd",    // ???
}

/** */
export enum HappBuildModeType {
    Debug   = "Debug",   // logs
    Release = "Release", // logs & optimization
    Retail  = "Retail",  // optimization (default)
}


/** INIT GLOBAL CONSTS */

console.log("Initializaing HAPP global consts");

let buildMode: HappBuildModeType;
let happEnv: HappEnvType;
try {
    happEnv = process.env.HAPP_ENV as HappEnvType;
    //console.log(`HAPP_ENV defined by process.ENV: "${happEnv}"`);
} catch (e) {
    /** Looking for Electron */
    const MY_ELECTRON_API = 'electronBridge' in window? window.electronBridge as any : undefined;
    if (MY_ELECTRON_API) {
        happEnv = HappEnvType.Electron;
        buildMode = MY_ELECTRON_API.BUILD_MODE;
        //console.log(`HAPP_ENV is "${HappEnvType.Electron}"`);
    }
    /** Looking for We */
    //console.log("window.IN_WE", (window as any).IN_WE);
    const isInWe = 'IN_WE' in window? window.IN_WE as boolean : false;
    if (isInWe) {
        happEnv = HappEnvType.We;
    }
    /** Looking for Holo */
    // FIXME
    /** Default to prod */
    happEnv = HappEnvType.Prod;
}


if (!buildMode) {
    try {
       buildMode = process.env.HAPP_BUILD_MODE as HappBuildModeType;
    } catch (e) {
       console.log(`HAPP_BUILD_MODE not defined. Defaulting to "${HappBuildModeType.Retail}"`);
       buildMode = HappBuildModeType.Retail;
    }
}

export let HAPP_BUILD_MODE = buildMode;
export let HAPP_ENV = happEnv;


console.log("HAPP_BUILD_MODE =", HAPP_BUILD_MODE)
console.log("       HAPP_ENV =", HAPP_ENV);

console.log("Initializaing HAPP global consts - DONE")


/** Remove console.log() in PROD */
// FIXME
// if (HAPP_BUILD_MODE === 'prod') {
//   console.log("console.log() disabled");
//   console.log = () => {};
// }
