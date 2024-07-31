import {
  ActionHash,
  EntryHash, HoloHash,
} from "@holochain/client";
import {
  AppletInfo, PeerStatusUpdate, WeaveServices,
  weaveUrlFromWal,
} from "@lightningrodlabs/we-applet";
import {
  AssetLocationAndInfo,
  FrameNotification,
  OpenWalMode,
  WAL
} from "@lightningrodlabs/we-applet/dist/types";
import {mdiFileExcelOutline} from "@mdi/js";
import {intoHrl, wrapPathInSvg} from "../utils";
import {ActionId, DnaId, EntryId, intoDhtId} from "@ddd-qc/cell-proxy";


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
export const emptyWeServicesMock: WeaveServices = {
  //attachmentTypes: new HoloHashMap<AppletHash, Record<AttachmentName, AttachmentType>>(),
  //attachmentTypes: fakeAttachmentTypes,
  mossVersion: (): string => {throw new Error("mossVersion() is not implemented on WeServicesMock."); },
  onPeerStatusUpdate: (callback: (payload: PeerStatusUpdate) => any) => {throw new Error("onPeerStatusUpdate() is not implemented on WeServicesMock."); },
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
  requestBind: (srcWal: WAL, dstWal: WAL) => {throw new Error("requestBind() is not implemented on WeServicesMock.");},
  requestClose: (): Promise<void> => {throw new Error("requestClose() is not implemented on WeServicesMock.");},
  myGroupPermissionType: () => {throw new Error("myGroupPermissionType() is not implemented on WeServicesMock.");},

};


var _mockClipboard = undefined;

/** Create default WeServices Mock */
export async function createDefaultWeServicesMock(devtestAppletId: EntryId): Promise<WeaveServices> {
  console.log("createDefaultWeServicesMock() devtestAppletId", devtestAppletId);
  const weServicesMock = emptyWeServicesMock;
  /** Implement appletInfo */
  weServicesMock.appletInfo = async (appletHash) => {
    const appletId = new EntryId(appletHash);
    console.log("DefaultWeServicesMock.appletInfo()", appletId, devtestAppletId);
    if (appletId.b64 == devtestAppletId.b64) {
      return {
        appletBundleId: new HoloHash(ActionId.empty(87).hash),
        appletName: "DevTestWeApplet",
        appletIcon: "",
        groupsHashes: [new HoloHash(DnaId.empty(71).hash)],
      } as AppletInfo;
    }
    return {
      appletBundleId: new HoloHash(ActionId.empty(87).hash),
      appletName: "MockApplet: " + appletId,
      appletIcon: "",
      groupsHashes: [new HoloHash(DnaId.empty(71).hash)],
    } as AppletInfo;
  };
  /** Implement entryInfo */
  weServicesMock.assetInfo = async (wal) => {
    console.log("DefaultWeServicesMock.assetInfo()", wal);
    return {
      appletHash: new HoloHash(devtestAppletId.hash),
      assetInfo: {
        icon_src: wrapPathInSvg(mdiFileExcelOutline),
        name: "MockEntry: " + intoDhtId(wal.hrl[1].bytes()).short,
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
      hrl: intoHrl(await DnaId.random(), await EntryId.random()),
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


