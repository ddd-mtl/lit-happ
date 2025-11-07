import {createDefaultWeServicesMock, DevTestNames, setup} from "@ddd-qc/we-utils";
import {createExampleApplet} from "./createExampleApplet";
import {AppletServices} from "@theweave/api";
import {LitElement} from "lit/development";


export const devtestNames: DevTestNames = {
  installed_app_id: "ExampleApplet",
  provisionedRoleName: "rNamedInteger",
}


/** */
export async function setupExampleApplet(): Promise<LitElement> {
  /** Determine appletView */
  let WE_APPLET_VIEW = "main";
  try {
    WE_APPLET_VIEW = process.env.WE_APPLET_VIEW!;
    //console.log(`HAPP_ENV defined by process.ENV: "${happEnv}"`);
  } catch (e:any) {
  }
  console.log("Example we-applet setup() WE_APPLET_VIEW", WE_APPLET_VIEW);
  switch(WE_APPLET_VIEW) {
    //case ThreadsEntryType.ParticipationProtocol: return setupVinesEntryView();
    //case ThreadsEntryType.ParticipationProtocol: return setupThreadsBlockView();
    case "main":
    default: return setupExampleMainView();
  }
}


/** */
async function setupExampleMainView() {
  const appletServices: AppletServices = {
    creatables: {},
    getAssetInfo,
    //bindAsset,//: async (a, b, c, d) => {},
    blockTypes: {},
    search,
  };
  return setup(appletServices, createExampleApplet, devtestNames, createDefaultWeServicesMock);
}


import {AppClient} from "@holochain/client";
import {AssetInfo, WAL, AppletHash} from "@theweave/api";
import {RecordInfo} from "@theweave/api/dist/types";
import {WeaveServices} from "@theweave/api/dist/api";

/** */
async function getAssetInfo(
  _appletClient: AppClient,
  _wal: WAL,
  _recordInfo?: RecordInfo,
): Promise<AssetInfo | undefined> {
    throw new Error(`getAssetInfo() not implemented`);
}

async function search(_appletClient: AppClient, _appletHash: AppletHash, _weServices: WeaveServices, _searchFilter: string): Promise<Array<WAL>> {
  throw new Error(`search() not implemented`);
}
