import {
  ActionHash,
  decodeHashFromBase64, encodeHashToBase64,
  EntryHash, fakeActionHash,
  fakeDnaHash, fakeEntryHash
} from "@holochain/client";
import {
  AppletInfo,
  weaveUrlFromWal,
  WeServices
} from "@lightningrodlabs/we-applet";
import {
  AppletHash,
  AssetLocationAndInfo,
  FrameNotification,
  OpenWalMode,
  WAL
} from "@lightningrodlabs/we-applet/dist/types";
import {mdiFileExcelOutline} from "@mdi/js";
import {wrapPathInSvg} from "../utils";


/** Build fake AttachmentTypes */
// const fakeNoteType = {
//   label: "FakeNote",
//   icon_src: wrapPathInSvg(mdiFileExcelOutline),
//   //create: (attachToHrl: Hrl): Promise<HrlWithContext> => {return {hrl: attachToHrl, context: {}}},
//   create: (hrlc: HrlWithContext): Promise<HrlWithContext> => {return Promise.reject("Create not implemented in Fake Attachment Type")},
// }
// const fakeAttachmentTypes: Map<AppletHash, Record<AttachmentName, AttachmentType>> = new Map();
// fakeAttachmentTypes.set(await fakeDnaHash(), {FakeNote: fakeNoteType})



/** */
export const emptyWeServicesMock: WeServices = {
  //attachmentTypes: new HoloHashMap<AppletHash, Record<AttachmentName, AttachmentType>>(),
  //attachmentTypes: fakeAttachmentTypes,
  openAppletMain: (appletHash: EntryHash): Promise<void> => {throw new Error("openAppletMain() is not implemented on WeServicesMock.");},
  openAppletBlock: (appletHash: EntryHash, block: string, context: any): Promise<void> => {throw new Error("openAppletBlock() is not implemented on WeServicesMock.");},
  openCrossAppletMain: (appletBundleId: ActionHash): Promise<void> => {throw new Error("openCrossAppletMain() is not implemented on WeServicesMock.");},
  openCrossAppletBlock: (appletBundleId: ActionHash, block: string, context: any): Promise<void> => {throw new Error("openCrossAppletBlock() is not implemented on WeServicesMock.");},
  openWal: (wal: WAL, mode?: OpenWalMode) : Promise<void> => {throw new Error("openWal() is not implemented on WeServicesMock.");},
  groupProfile: (groupId): Promise<any> => {throw new Error("groupProfile() is not implemented on WeServicesMock.");},
  appletInfo: (appletHash): Promise<AppletInfo | undefined> => {throw new Error("appletInfo() is not implemented on WeServicesMock.");},
  assetInfo: (wal: WAL): Promise<AssetLocationAndInfo | undefined> => {throw new Error("assetInfo() is not implemented on WeServicesMock.");},
  walToPocket: (wal: WAL): Promise<void> => {throw new Error("hrlToClipboard() is not implemented on WeServicesMock.");},
  //search: (searchFilter: string): Promise<any> => {throw new Error("search() is not implemented on WeServicesMock.");},
  userSelectWal: (): Promise<WAL | undefined> => {throw new Error("userSelectWal() is not implemented on WeServicesMock.");},
  notifyFrame: (notifications: Array<FrameNotification>): Promise<any> => {throw new Error("notifyFrame() is not implemented on WeServicesMock.");},
  userSelectScreen: (): Promise<string> => {throw new Error("userSelectScreen() is not implemented on WeServicesMock.");},
  requestBind: (srcWal: WAL, dstWal: WAL) => {throw new Error("requestBind() is not implemented on WeServicesMock.");}
};


var _mockClipboard = undefined;

/** Create default WeServices Mock */
export async function createDefaultWeServicesMock(devtestAppletId: string): Promise<WeServices> {
  console.log("createDefaultWeServicesMock() devtestAppletId", devtestAppletId);
  const weServicesMock = emptyWeServicesMock;
  /** Implement appletInfo */
  weServicesMock.appletInfo = async (appletHash) => {
    const appletId = encodeHashToBase64(appletHash);
    console.log("DefaultWeServicesMock.appletInfo()", appletId, devtestAppletId);
    if (appletId == devtestAppletId) {
      return {
        appletBundleId: await fakeActionHash(),
        appletName: "DevTestWeApplet",
        groupsIds: [await fakeDnaHash()],
      } as AppletInfo;
    }
    return {
      appletBundleId: await fakeActionHash(),
      appletName: "MockApplet: " + appletId,
      groupsIds: [await fakeDnaHash()],
    } as AppletInfo;
  };
  /** Implement entryInfo */
  weServicesMock.assetInfo = async (wal) => {
    console.log("DefaultWeServicesMock.assetInfo()", wal);
    return {
      appletHash: decodeHashFromBase64(devtestAppletId),
      assetInfo: {
        icon_src: wrapPathInSvg(mdiFileExcelOutline),
        name: "MockEntry: " + encodeHashToBase64(wal.hrl[1]),
      }
    } as AssetLocationAndInfo;
  }
  /** Implement userSelectHrl */
  weServicesMock.userSelectWal = async () => {
    if (_mockClipboard) {
      const copy = _mockClipboard;
      _mockClipboard = undefined;
      return copy;
    }
    return {
      hrl: [await fakeDnaHash(), await fakeEntryHash()],
      context: null,
    } as WAL;
  }
  /** Implement groupProfile */
  weServicesMock.groupProfile = async (groupId) => {
    return {
      name: "FakeGroupeName",
      logo_src: "",
    }
  }
  /** Implement openHrl */
  weServicesMock.openWal = async (hrlc: WAL): Promise<void> => {
    alert("Mock weServices.openHrl() for hrl: " + weaveUrlFromWal({hrl:hrlc.hrl}) + "\n\n see console for context");
    console.log("weServicesMock.openHrl() context:", hrlc.context);
  }
  /** Implement notifyWe */
  weServicesMock.notifyFrame = async (notifications: Array<FrameNotification>): Promise<any> => {
    alert(`Mock weServices.notifyWe(${notifications.length})\n\n see console for details`);
    console.log("weServicesMock.notifyWe() notifications:", notifications);
  }
  /** Implement hrlToClipboard */
  weServicesMock.walToPocket = async (wal: WAL): Promise<void> => {
    _mockClipboard = wal;
  }
  /** Done */
  return weServicesMock;
}


