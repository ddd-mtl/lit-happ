
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

console.log("[lit-happ] Initializaing LIT-HAPP global consts", window);

let buildMode: HappBuildModeType;
let happEnv: HappEnvType;


const maybeElectronApi = 'electronBridge' in window? window.electronBridge as any : undefined;

/** Determine HappEnv */
try {
    happEnv = process.env.HAPP_ENV as HappEnvType;
    //console.log(`HAPP_ENV defined by process.ENV: "${happEnv}"`);
} catch (e) {
    /** Looking for Electron */
    if (maybeElectronApi) {
        happEnv = HappEnvType.Electron;
        buildMode = maybeElectronApi.BUILD_MODE;
        //console.log(`HAPP_ENV is "${HappEnvType.Electron}"`);
    } else {
        /** Looking for We */
        const isInWe = 'IN_WE' in window? window.IN_WE as boolean : false;
        if (isInWe) {
            happEnv = HappEnvType.We;
        } else {
            /** Looking for Holo */
            // FIXME
            const isInHolo = false;
            if (isInHolo) {
                happEnv = HappEnvType.Holo;
            } else {
                /** Default to prod */
                happEnv = HappEnvType.Prod;
            }
        }
    }
}

/** Determine BuildMode */
if (!buildMode) {
    try {
       buildMode = process.env.HAPP_BUILD_MODE as HappBuildModeType;
    } catch (e) {
       console.log(`[lit-happ] HAPP_BUILD_MODE not defined. Defaulting to "${HappBuildModeType.Retail}"`);
       buildMode = HappBuildModeType.Retail;
    }
}

/** export result */
export let HAPP_BUILD_MODE = buildMode;
export let HAPP_ENV = happEnv;
export let HAPP_ELECTRON_API = maybeElectronApi;

console.log("[lit-happ]  HAPP_BUILD_MODE =", HAPP_BUILD_MODE)
console.log("[lit-happ]         HAPP_ENV =", HAPP_ENV);
if (HAPP_ELECTRON_API) {
    console.log("[lit-happ] HAPP_ELECTRON_API =", HAPP_ENV);
}

console.log("[lit-happ] Initializaing LIT-HAPP global consts - DONE")


/** Remove console.log() in PROD */
// FIXME
// if (HAPP_BUILD_MODE === 'prod') {
//   console.log("console.log() disabled");
//   console.log = () => {};
// }
