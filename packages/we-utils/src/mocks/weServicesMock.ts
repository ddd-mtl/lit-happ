import {
  ActionHash,
  decodeHashFromBase64, encodeHashToBase64,
  EntryHash, fakeActionHash,
  fakeDnaHash, fakeEntryHash
} from "@holochain/client";
import {
  AppletInfo,
  AttachmentType,
  EntryLocationAndInfo,
  Hrl,
  WeNotification,
  WeServices
} from "@lightningrodlabs/we-applet";
import {AppletHash, AttachmentName, HrlWithContext} from "@lightningrodlabs/we-applet/dist/types";
import {mdiFileExcelOutline} from "@mdi/js";
import {stringifyHrl, wrapPathInSvg} from "../utils";


/** Build fake AttachmentTypes */
const fakeNoteType = {
  label: "FakeNote",
  icon_src: wrapPathInSvg(mdiFileExcelOutline),
  //create: (attachToHrl: Hrl): Promise<HrlWithContext> => {return {hrl: attachToHrl, context: {}}},
  create: (attachToHrl: Hrl): Promise<HrlWithContext> => {return Promise.reject("Create not implemented in Fake Attachment Type")},
}
const fakeAttachmentTypes: Map<AppletHash, Record<AttachmentName, AttachmentType>> = new Map();
fakeAttachmentTypes.set(await fakeDnaHash(), {FakeNote: fakeNoteType})



/** */
export const emptyWeServicesMock: WeServices = {
  //attachmentTypes: new HoloHashMap<AppletHash, Record<AttachmentName, AttachmentType>>(),
  attachmentTypes: fakeAttachmentTypes,
  openAppletMain: (appletHash: EntryHash): Promise<void> => {throw new Error("openAppletMain() is not implemented on WeServicesMock.");},
  openAppletBlock: (appletHash, block: string, context: any): Promise<void> => {throw new Error("openAppletBlock() is not implemented on WeServicesMock.");},
  openCrossAppletMain: (appletBundleId: ActionHash): Promise<void> => {throw new Error("openCrossAppletMain() is not implemented on WeServicesMock.");},
  openCrossAppletBlock: (appletBundleId: ActionHash, block: string, context: any): Promise<void> => {throw new Error("openCrossAppletBlock() is not implemented on WeServicesMock.");},
  openHrl: (hrl: Hrl, context: any): Promise<void> => {throw new Error("openHrl() is not implemented on WeServicesMock.");},
  groupProfile: (groupId): Promise<any> => {throw new Error("groupProfile() is not implemented on WeServicesMock.");},
  appletInfo: (appletHash): Promise<AppletInfo | undefined> => {throw new Error("appletInfo() is not implemented on WeServicesMock.");},
  entryInfo: (hrl: Hrl): Promise<EntryLocationAndInfo | undefined> => {throw new Error("entryInfo() is not implemented on WeServicesMock.");},
  hrlToClipboard: (hrl: HrlWithContext): Promise<void> => {throw new Error("hrlToClipboard() is not implemented on WeServicesMock.");},
  search: (searchFilter: string): Promise<any> => {throw new Error("search() is not implemented on WeServicesMock.");},
  userSelectHrl: (): Promise<HrlWithContext | undefined> => {throw new Error("userSelectHrl() is not implemented on WeServicesMock.");},
  notifyWe: (notifications: Array<WeNotification>): Promise<any> => {throw new Error("notifyWe() is not implemented on WeServicesMock.");}
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
      appletName: "Mock: " + appletId,
      groupsIds: [await fakeDnaHash()],
    } as AppletInfo;
  };
  /** Implement entryInfo */
  weServicesMock.entryInfo = async (hrl) => {
    console.log("DefaultWeServicesMock.entryInfo()", hrl);
    return {
      appletHash: decodeHashFromBase64(devtestAppletId),
      entryInfo: {
        icon_src: wrapPathInSvg(mdiFileExcelOutline),
        name: "Mock: " + encodeHashToBase64(hrl[1]),
      }
    } as EntryLocationAndInfo;
  }
  /** Implement userSelectHrl */
  weServicesMock.userSelectHrl = async () => {
    if (_mockClipboard) {
      const copy = _mockClipboard;
      _mockClipboard = undefined;
      return copy;
    }
    return {
      hrl: [await fakeDnaHash(), await fakeEntryHash()],
      context: null,
    } as HrlWithContext;
  }
  /** Implement groupProfile */
  // FIXME
  /** Implement openHrl */
  weServicesMock.openHrl = async (hrl: Hrl, context: any): Promise<void> => {
    alert("Mock weServices.openHrl() for hrl: " + stringifyHrl(hrl) + "\n\n see console for context");
    console.log("weServicesMock.openHrl() context:", context);
  }
  /** Implement notifyWe */
  weServicesMock.notifyWe = async (notifications: Array<WeNotification>): Promise<any> => {
    alert(`Mock weServices.notifyWe(${notifications.length})\n\n see console for details`);
    console.log("weServicesMock.notifyWe() notifications:", notifications);
  }
  /** Implement hrlToClipboard */
  weServicesMock.hrlToClipboard = async (hrl: HrlWithContext): Promise<void> => {
    _mockClipboard = hrl;
  }
  /** Done */
  return weServicesMock;
}


