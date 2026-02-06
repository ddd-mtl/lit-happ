import {
  EntryHash, CreateCloneCellRequest, EnableCloneCellRequest, DisableCloneCellRequest,
} from "@holochain/client";
import {
  AssetServices,
  AppletInfo, PeerStatusUpdate, WeaveServices,
  weaveUrlFromWal, AssetLocationAndInfo,
  FrameNotification,
  OpenAssetMode,
  WAL
} from "@theweave/api";
import {mdiFileExcelOutline} from "@mdi/js";
import {ActionId, DnaId, EntryId, intoDhtId} from "@ddd-qc/cell-proxy";
import {intoHrl, wrapPathInSvg} from "../utils";


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
export const emptyAssetServicesMock: AssetServices = {
  assetInfo: (_wal: WAL): Promise<AssetLocationAndInfo | undefined> => {throw new Error("assetInfo() is not implemented in emptyAssetServicesMock.");},
  dragAsset: (_wal: WAL) => {throw new Error("dragAsset() is not implemented in emptyAssetServicesMock.");},
  assetToPocket: (_wal: WAL) => {throw new Error("assetToPocket() is not implemented in emptyAssetServicesMock.");},
  userSelectAsset: () => {throw new Error("userSelectAsset() is not implemented in emptyAssetServicesMock.");},
  userSelectAssetRelationTag: (): Promise<string | undefined> => {throw new Error("userSelectAssetRelationTag() is not implemented in emptyAssetServicesMock.");},
  addTagsToAsset: (_wal: WAL, _tags: string[]) => {throw new Error("addTagsToAsset() is not implemented in emptyAssetServicesMock.");},
  removeTagsFromAsset: (_wal: WAL, _tags: string[]) => {throw new Error("removeTagsFromAsset() is not implemented in emptyAssetServicesMock.");},
  addAssetRelation: (_srcWal: WAL, _dstWal: WAL, _tags?: string[]) => {throw new Error("addAssetRelation() is not implemented in emptyAssetServicesMock.");},
  removeAssetRelation: (_relationHash: EntryHash) => {throw new Error("removeAssetRelation() is not implemented in emptyAssetServicesMock.");},
  addTagsToAssetRelation: (_relationHash: EntryHash, _tags: string[]) => {throw new Error("addTagsToAssetRelation() is not implemented in emptyAssetServicesMock.");},
  removeTagsFromAssetRelation: (_relationHash: EntryHash, _tags: string[]) => {throw new Error("removeTagsFromAssetRelation() is not implemented in emptyAssetServicesMock.");},
  getAllAssetRelationTags: (_crossGroup?: boolean): Promise<string[]> => {throw new Error("getAllAssetRelationTags() is not implemented in emptyAssetServicesMock.");},
  assetStore: (_wal: WAL) => {throw new Error("assetStore() is not implemented in emptyAssetServicesMock.");},

}

/** */
export const emptyWeServicesMock: WeaveServices = {
  assets: emptyAssetServicesMock,
  //attachmentTypes: new HoloHashMap<AppletHash, Record<AttachmentName, AttachmentType>>(),
  //attachmentTypes: fakeAttachmentTypes,
  mossVersion: (): string => {throw new Error("mossVersion() is not implemented on WeServicesMock."); },
  onPeerStatusUpdate: (_callback: (payload: PeerStatusUpdate) => any) => {throw new Error("onPeerStatusUpdate() is not implemented on WeServicesMock."); },
  onBeforeUnload: (_callback: () => void) => {console.warn("onBeforeUnload() is not implemented on WeServicesMock."); const noop = () => {};  return noop},
  openAppletMain: (_appletHash: EntryHash): Promise<void> => {throw new Error("openAppletMain() is not implemented on WeServicesMock.");},
  openAppletBlock: (_appletHash: EntryHash, _block: string, _context: any): Promise<void> => {throw new Error("openAppletBlock() is not implemented on WeServicesMock.");},
  openCrossGroupMain: (_appletBundleId: string): Promise<void> => {throw new Error("openCrossAppletMain() is not implemented on WeServicesMock.");},
  openCrossGroupBlock: (_appletBundleId: string, _block: string, _context: any): Promise<void> => {throw new Error("openCrossAppletBlock() is not implemented on WeServicesMock.");},
  openAsset: (_wal: WAL, _mode?: OpenAssetMode) : Promise<void> => {throw new Error("openAsset() is not implemented on WeServicesMock.");},
  groupProfile: (_groupId): Promise<any> => {throw new Error("groupProfile() is not implemented on WeServicesMock.");},
  appletInfo: (_appletHash): Promise<AppletInfo | undefined> => {throw new Error("appletInfo() is not implemented on WeServicesMock.");},
  //search: (searchFilter: string): Promise<any> => {throw new Error("search() is not implemented on WeServicesMock.");},
  notifyFrame: (_notifications: Array<FrameNotification>): Promise<any> => {throw new Error("notifyFrame() is not implemented on WeServicesMock.");},
  userSelectScreen: (): Promise<string> => {throw new Error("userSelectScreen() is not implemented on WeServicesMock.");},
  requestClose: (): Promise<void> => {throw new Error("requestClose() is not implemented on WeServicesMock.");},
  toolInstaller: (_a, _g)=> {throw new Error("toolInstaller() is not implemented on WeServicesMock.");},
  myAccountabilitiesPerGroup: () => {throw new Error("myAccountabilitiesPerGroup() is not implemented on WeServicesMock.");},
  appletParticipants() {throw new Error("appletParticipants() is not implemented on WeServicesMock.");},
  sendRemoteSignal: (_payload: Uint8Array) => {throw new Error("sendRemoteSignal() is not implemented on WeServicesMock.");},
  onRemoteSignal: (_callback: (payload: Uint8Array) => any) => {throw new Error("onRemoteSignal() is not implemented on WeServicesMock.");},
  createCloneCell: (_req: CreateCloneCellRequest, _publicToGroupMembers: boolean) => {throw new Error("createCloneCell() is not implemented on WeServicesMock.");},
  enableCloneCell: (_req: EnableCloneCellRequest) => {throw new Error("enableCloneCell() is not implemented on WeServicesMock.");},
  disableCloneCell: (_req: DisableCloneCellRequest) => {throw new Error("disableCloneCell() is not implemented on WeServicesMock.");},

  getLocale: () => {throw new Error("getLocale() is not implemented on WeServicesMock.");},
  onLocaleChange: (_callback: (locale: string) => any) => {throw new Error("onLocaleChange() is not implemented on WeServicesMock.");},
};


var _mockClipboard: any = undefined;

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
        appletBundleId: ActionId.empty(87).b64,
        appletName: "DevTestWeApplet",
        appletIcon: "",
        groupsHashes: [DnaId.empty(71).hash],
      } as AppletInfo;
    }
    return {
      appletBundleId: ActionId.empty(87).b64,
      appletName: "MockApplet: " + appletId,
      appletIcon: "",
      groupsHashes: [DnaId.empty(71).hash],
    } as AppletInfo;
  };
  /** Implement entryInfo */
  weServicesMock.assets.assetInfo = async (wal) => {
    console.log("DefaultWeServicesMock.assetInfo()", wal);
    return {
      appletHash: devtestAppletId.hash,
      assetInfo: {
        icon_src: wrapPathInSvg(mdiFileExcelOutline),
        name: "MockEntry: " + intoDhtId(wal.hrl[1]).short,
      }
    } as AssetLocationAndInfo;
  }
  /** Implement userSelectHrl */
  weServicesMock.assets.userSelectAsset = async () => {
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
  weServicesMock.groupProfile = async (_groupId) => {
    return {
      name: "FakeGroupeName",
      logo_src: "",
    }
  }
  /** Implement openHrl */
  weServicesMock.openAsset = async (hrlc: WAL): Promise<void> => {
    alert("Mock weServices.openHrl() for hrl: " + weaveUrlFromWal({hrl:hrlc.hrl}) + "\n\n see console for context");
    console.log("weServicesMock.openHrl() context:", hrlc.context);
  }
  /** Implement notifyWe */
  weServicesMock.notifyFrame = async (notifications: Array<FrameNotification>): Promise<any> => {
    alert(`Mock weServices.notifyWe(${notifications.length})\n\n see console for details`);
    console.log("weServicesMock.notifyWe() notifications:", notifications);
  }
  /** Implement hrlToClipboard */
  weServicesMock.assets.assetToPocket = async (wal: WAL): Promise<void> => {
    _mockClipboard = wal;
  }
  /** Done */
  return weServicesMock;
}


