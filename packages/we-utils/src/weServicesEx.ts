import {
  AppletId,
  AppletInfo,
  weaveUrlFromWal, AssetLocationAndInfo, WAL, AssetStore, AssetServices,
  WeaveServices, PeerStatusUpdate, GroupProfile, GroupPermissionType,
  OpenAssetMode, FrameNotification,
} from "@theweave/api";
import {
  EntryHash, HoloHashB64,
  CreateCloneCellRequest, CreateCloneCellResponse, EnableCloneCellRequest, EnableCloneCellResponse,
  DisableCloneCellRequest,
} from "@holochain/client";
import {UnsubscribeFunction} from "emittery";
import {DnaId, DnaIdMap, EntryId, EntryIdMap} from "@ddd-qc/cell-proxy";


/** */
export interface WeServicesCache {
  assetInfos: Record<string, AssetLocationAndInfo | undefined>;
  groupProfiles: DnaIdMap<any | undefined>;
  appletInfos: EntryIdMap<AppletInfo | undefined>;
}


export class AssetServicesEx implements AssetServices {

  /** wurl -> AssetLocationAndInfo */
  assetInfoCache: Record<string, AssetLocationAndInfo | undefined> = {};


  /** */
  constructor(private _inner: AssetServices) {
    // n/a
  }


  /** */
  async assetInfo(wal: WAL): Promise<AssetLocationAndInfo | undefined> {
    const wurl = weaveUrlFromWal({hrl: wal.hrl});
    if (this.assetInfoCache[wurl]) {
      return this.assetInfoCache[wurl];
    }
    this.assetInfoCache[wurl] = await this._inner.assetInfo(wal);
    return this.assetInfoCache[wurl];
  }

  async dragAsset(wal: WAL): Promise<void> {return this._inner.dragAsset(wal)}
  async assetToPocket(wal: WAL): Promise<void> {return this._inner.assetToPocket(wal)}
  async userSelectAsset(): Promise<WAL | undefined> {return this._inner.userSelectAsset()}

  async addTagsToAsset(wal: WAL, tags: string[]): Promise<void> {return this._inner.addTagsToAsset(wal, tags)}
  async removeTagsFromAsset(wal: WAL, tags: string[]): Promise<void> {return this._inner.removeTagsFromAsset(wal, tags)}
  async addAssetRelation(srcWal: WAL, dstWal: WAL, tags?: string[]): Promise<void> {return this._inner.addAssetRelation(srcWal, dstWal, tags)}
  async removeAssetRelation(relationHash: EntryHash): Promise<void> {return this._inner.removeAssetRelation(relationHash)}
  async addTagsToAssetRelation(relationHash: EntryHash, tags: string[]): Promise<void> {return this._inner.addTagsToAssetRelation(relationHash, tags)}
  async removeTagsFromAssetRelation(relationHash: EntryHash, tags: string[]): Promise<void> {return this._inner.removeTagsFromAssetRelation(relationHash, tags)}

  assetStore(wal: WAL): AssetStore {return this._inner.assetStore(wal)}
}


/** WeServices wrapper that caches requested infos */
export class WeServicesEx implements WeaveServices {

  assets: AssetServicesEx;

  constructor(private _inner: WeaveServices, private _thisAppletIds: EntryId[]) {
    /*await*/ this.initAppletInfo(this._thisAppletIds);
    this.assets = new AssetServicesEx(_inner.assets);
  }

  private async initAppletInfo(thisAppletIds: EntryId[]) {
    for (const thisAppletId of thisAppletIds) {
      const maybePair = await this.cacheFullAppletInfo(thisAppletId);
      if (maybePair) {
        if (!this._groupProfiles) {
          this._groupProfiles = maybePair[1];
        } else {
          this._groupProfiles = new DnaIdMap([...this._groupProfiles, ...maybePair[1]]);
        }
      }
    }
  }

  /** groupId -> groupProfile */
  private _groupProfiles: DnaIdMap<GroupProfile> = new DnaIdMap();
  /** DnaHashB64 -> groupProfile */
  private _groupProfileCache: DnaIdMap<any | undefined> = new DnaIdMap();
  /** appletId -> AppletInfo */
  private _appletInfoCache: EntryIdMap<AppletInfo | undefined> = new EntryIdMap();

  /** -- Getters -- */

  get cache(): WeServicesCache {
    return {
      assetInfos: this.assets.assetInfoCache,
      groupProfiles: this._groupProfileCache,
      appletInfos: this._appletInfoCache,
    };
  }

  get appletIds(): AppletId[] {return this._thisAppletIds.map((b) => b.b64)}

  get groupProfiles(): DnaIdMap<GroupProfile> {return this._groupProfiles}

  assetInfoCached(wal_or_wurl: WAL | string): AssetLocationAndInfo | undefined {
    let wurl = wal_or_wurl as string;
    if (typeof wal_or_wurl == 'object') {
      wurl = weaveUrlFromWal({hrl: wal_or_wurl.hrl});
    }
    return this.assets.assetInfoCache[wurl];
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
  onBeforeUnload(callback: () => void): UnsubscribeFunction {return this._inner.onBeforeUnload(callback)}
  async openAppletMain(appletHash: EntryHash): Promise<void> {return this._inner.openAppletMain(appletHash)}
  async openAppletBlock(appletHash: EntryHash, block: string, context: any): Promise<void> {return this._inner.openAppletBlock(appletHash, block, context)}
  async openCrossGroupMain(appletBundleId: string): Promise<void>  {return this._inner.openCrossGroupMain(appletBundleId)}
  async openCrossGroupBlock(appletBundleId: string, block: string, context: any): Promise<void>  {return this._inner.openCrossGroupBlock(appletBundleId, block, context)}
  async openAsset(wal: WAL, mode?: OpenAssetMode): Promise<void> {return this._inner.openAsset(wal, mode)}
  async notifyFrame(notifications: Array<FrameNotification>): Promise<any>  {return this._inner.notifyFrame(notifications)}
  async userSelectScreen(): Promise<string>  {return this._inner.userSelectScreen()}
  //async requestBind(srcWal: WAL, dstWal: WAL) {return this._inner.requestBind(srcWal, dstWal)}
  async requestClose() {return this._inner.requestClose()}
  async myGroupPermissionType(): Promise<GroupPermissionType> {return this._inner.myGroupPermissionType()}
  async appletParticipants()/*: Promise<AgentPubKey[]>*/ {return this._inner.appletParticipants()}

  async sendRemoteSignal(payload: Uint8Array): Promise<void> {return this._inner.sendRemoteSignal(payload)}
  onRemoteSignal(callback: (payload: Uint8Array) => any): UnsubscribeFunction  {return this._inner.onRemoteSignal(callback)}

  async createCloneCell(req: CreateCloneCellRequest, publicToGroupMembers: boolean): Promise<CreateCloneCellResponse>  {return this._inner.createCloneCell(req, publicToGroupMembers)}
  async enableCloneCell(req: EnableCloneCellRequest): Promise<EnableCloneCellResponse>  {return this._inner.enableCloneCell(req)}
  async disableCloneCell(req: DisableCloneCellRequest): Promise<void>  {return this._inner.disableCloneCell(req)}

}
