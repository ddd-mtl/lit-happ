import {
  AppletId,
  AppletInfo,
  weaveUrlFromWal,
  WeaveServices, PeerStatusUpdate, GroupPermissionType,
} from "@lightningrodlabs/we-applet";
import {
  AssetLocationAndInfo, FrameNotification, GroupProfile, OpenWalMode, WAL,
} from "@lightningrodlabs/we-applet/dist/types";
import {
  ActionHash,
  EntryHash, HoloHashB64,
} from "@holochain/client";
import {UnsubscribeFunction} from "emittery";
import {DnaId, DnaIdMap, EntryId, EntryIdMap} from "@ddd-qc/cell-proxy";


/** */
export interface WeServicesCache {
  assetInfos: Record<string, AssetLocationAndInfo | undefined>;
  groupProfiles: DnaIdMap<any | undefined>;
  appletInfos: EntryIdMap<AppletInfo | undefined>;
}


/** WeServices wrapper that caches requested infos */
export class WeServicesEx implements WeaveServices {

  constructor(private _inner: WeaveServices, private _thisAppletId: EntryId) {
    this.cacheFullAppletInfo(_thisAppletId).then((maybePair) => {
      if (maybePair) {
        this._groupProfiles = maybePair[1];
      }
    })
  }

  /** groupId -> groupProfile */
  private _groupProfiles: DnaIdMap<GroupProfile> = new DnaIdMap();
  /** DnaHashB64 -> groupProfile */
  private _groupProfileCache: DnaIdMap<any | undefined> = new DnaIdMap();
  /** appletId -> AppletInfo */
  private _appletInfoCache: EntryIdMap<AppletInfo | undefined> = new EntryIdMap();
  /** wurl -> AssetLocationAndInfo */
  private _assetInfoCache: Record<string, AssetLocationAndInfo | undefined> = {};

  /** -- Getters -- */

  get cache(): WeServicesCache {
    return {
      assetInfos: this._assetInfoCache,
      groupProfiles: this._groupProfileCache,
      appletInfos: this._appletInfoCache,
    };
  }

  get appletId(): AppletId {return this._thisAppletId.b64}

  get groupProfiles(): DnaIdMap<GroupProfile> {return this._groupProfiles}

  assetInfoCached(wal_or_wurl: WAL | string): AssetLocationAndInfo | undefined {
    let wurl = wal_or_wurl as string;
    if (typeof wal_or_wurl == 'object') {
      wurl = weaveUrlFromWal({hrl: wal_or_wurl.hrl});
    }
    return this._assetInfoCache[wurl];
  }
  groupProfileCached(groupId: DnaId): any | undefined {
    return this._groupProfileCache.get(groupId);
  }
  appletInfoCached(appletId: EntryId): AppletInfo | undefined {
    return this._appletInfoCache.get(appletId);
  }


  /** -- Call & cache info  -- */

  /** */
  async cacheFullAppletInfo(appletId: EntryId): Promise<[AppletInfo, DnaIdMap<GroupProfile>] | undefined> {
    /* Grab appletInfo and all groupProfiles */
    const appletInfo = await this.appletInfo(appletId.hash);
    if (!appletInfo) {
      return undefined;
    }
    const groupProfiles: DnaIdMap<GroupProfile> = new DnaIdMap();
    for (const groupHash of appletInfo.groupsHashes) {
      const gp = await this.groupProfile(groupHash);
      groupProfiles.set(new DnaId(groupHash), gp);
    }
    return [appletInfo, groupProfiles];
  }


  /** -- WeaveServices API -- */

  /** */
  async assetInfo(wal: WAL): Promise<AssetLocationAndInfo | undefined> {
    const wurl = weaveUrlFromWal({hrl: wal.hrl});
    if (this._assetInfoCache[wurl]) {
      return this._assetInfoCache[wurl];
    }
    this._assetInfoCache[wurl] = await this._inner.assetInfo(wal);
    return this._assetInfoCache[wurl];
  }


  /** */
  async groupProfile(groupHash: HoloHashB64 | Uint8Array): Promise<any> {
    const groupId = new DnaId(groupHash);
    if (this._groupProfileCache.get(groupId)) {
      return this._groupProfileCache.get(groupId);
    }
    this._groupProfileCache.set(groupId, await this._inner.groupProfile(groupId.hash));
    return this._groupProfileCache.get(groupId);
  }


  /** */
  async appletInfo(appletHash: HoloHashB64 | Uint8Array): Promise<AppletInfo | undefined> {
    const appletId = new EntryId(appletHash);
    if (this._appletInfoCache.get(appletId)) {
      return this._appletInfoCache.get(appletId);
    }
    this._appletInfoCache.set(appletId, await this._inner.appletInfo(appletId.hash));
    return this._appletInfoCache.get(appletId);
  }


  /** -- Passthrough  -- */
  mossVersion(): string {return this._inner.mossVersion();}
  onPeerStatusUpdate(callback: (payload: PeerStatusUpdate) => any): UnsubscribeFunction {return this._inner.onPeerStatusUpdate(callback)}
  async openAppletMain(appletHash: EntryHash): Promise<void> {return this._inner.openAppletMain(appletHash)}
  async openAppletBlock(appletHash: EntryHash, block: string, context: any): Promise<void> {return this._inner.openAppletBlock(appletHash, block, context)}
  async openCrossAppletMain(appletBundleId: ActionHash): Promise<void>  {return this._inner.openCrossAppletMain(appletBundleId)}
  async openCrossAppletBlock(appletHash: EntryHash, block: string, context: any): Promise<void>  {return this._inner.openCrossAppletBlock(appletHash, block, context)}
  async openWal(wal: WAL, mode?: OpenWalMode): Promise<void>  {return this._inner.openWal(wal, mode)}
  async walToPocket(wal: WAL): Promise<void>  {return this._inner.walToPocket(wal)}
  //async search(searchFilter: string): Promise<any>  {return this._inner.search(searchFilter)}
  async userSelectWal(): Promise<WAL | undefined>  {return this._inner.userSelectWal()}
  async notifyFrame(notifications: Array<FrameNotification>): Promise<any>  {return this._inner.notifyFrame(notifications)}
  async userSelectScreen(): Promise<string>  {return this._inner.userSelectScreen()}
  async requestBind(srcWal: WAL, dstWal: WAL) {return this._inner.requestBind(srcWal, dstWal)}
  async requestClose() {return this._inner.requestClose()}
  async myGroupPermissionType(): Promise<GroupPermissionType> {return this._inner.myGroupPermissionType()}
  async appletParticipants() {return this._inner.appletParticipants()}
}
