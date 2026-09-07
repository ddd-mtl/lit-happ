import {LitElement} from "lit";
import {AppClient} from "@holochain/client";
import {AppletServices, AssetInfo, WAL, AppletHash, RecordInfo, WeaveServices} from "@theweave/api";
import {createDefaultWeServicesMock, DevTestNames, setup} from "@ddd-qc/we-utils";
import {createPlaygroundApplet} from "./createPlaygroundApplet";


/** */
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
  } catch (e:any) {
      console.trace(`process.env.WE_APPLET_VIEW not defined"`);
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
    search,
  };
  return setup(appletServices, createPlaygroundApplet, devtestNames, createDefaultWeServicesMock);
}

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
