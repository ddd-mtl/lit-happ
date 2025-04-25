
/** */
export enum HappEnvType {
    Browser     = "Browser",   // default value
    We          = "We",        // if window.IN_WE defined
    BrowserWe   = "BrowserWe", // Testing we-applet in browser
    Electron    = "Electron",  // if window.electronBridge is defined
    Holo        = "Holo",      // ???
}

export function isHappEnv(value: any): value is HappEnvType {
    return Object.values(HappEnvType).includes(value);
}

/** */
export enum HappBuildModeType {
    Debug   = "Debug",   // logs
    Release = "Release", // logs & optimization
    Retail  = "Retail",  // optimization (default)
}

export function isHappBuildMode(value: any): value is HappBuildModeType {
    return Object.values(HappBuildModeType).includes(value);
}


/** INIT GLOBAL CONSTS */

console.log("[lit-happ] Initializaing LIT-HAPP global consts", window);

let buildMode: HappBuildModeType | undefined = undefined;
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
                happEnv = HappEnvType.Browser;
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

if (!isHappBuildMode(buildMode)) {
    console.error("[lit-happ] buildMode not valid", buildMode);
}

if (!isHappEnv(happEnv)) {
    console.error("[lit-happ] happEnv not valid", happEnv);
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
