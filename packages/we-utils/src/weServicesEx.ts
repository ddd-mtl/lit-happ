import {
  AppletId,
  AppletInfo,
  weaveUrlFromWal,
  WeServices,
} from "@lightningrodlabs/we-applet";
import {
  AppletHash, AssetLocationAndInfo, FrameNotification, OpenWalMode, WAL,
} from "@lightningrodlabs/we-applet/dist/types";
import {ActionHash, DnaHash, DnaHashB64, encodeHashToBase64, EntryHash, EntryHashB64} from "@holochain/client";


/** WeServices wrapper that caches requested infos */
export class WeServicesEx implements WeServices {

  //attachmentTypes: ReadonlyMap<AppletHash, Record<AttachmentName, AttachmentType>>;

  constructor(private _inner: WeServices, private _thisAppletId: AppletId) {
    //this.attachmentTypes = _inner.attachmentTypes;
  }

  /** wurl -> AssetLocationAndInfo */
  private _attachableInfoCache: Record<string, AssetLocationAndInfo | undefined> = {};
  /** DnaHashB64 -> groupProfile */
  private _groupProfileCache: Record<string, any | undefined> = {};
  /** appletId -> AppletInfo */
  private _appletInfoCache: Record<AppletId, AppletInfo | undefined> = {};


  /** -- Getters -- */

  get appletId(): AppletId {return this._thisAppletId}

  getAssetInfo(wal_or_wurl: WAL | string): AssetLocationAndInfo | undefined {
    let wurl = wal_or_wurl as string;
    if (typeof wal_or_wurl == 'object') {
      wurl = weaveUrlFromWal({hrl: wal_or_wurl.hrl});
    }
    return this._attachableInfoCache[wurl];
  }
  getAttachables(): string[] {
    return Object.keys(this._attachableInfoCache);
  }

  getGroupProfile(groupdId: DnaHash | DnaHashB64): any | undefined {
    let index = groupdId as DnaHashB64;
    if (typeof groupdId != 'string') {
      index = encodeHashToBase64(groupdId);
    }
    return this._groupProfileCache[index];
  }
  getGroupIds(): DnaHashB64[] {
    return Object.keys(this._groupProfileCache);
  }

  getAppletInfo(appletId: EntryHash | EntryHashB64): AppletInfo | undefined {
    let index = appletId as EntryHashB64;
    if (typeof appletId != 'string') {
      index = encodeHashToBase64(appletId);
    }
    return this._appletInfoCache[index];
  }
  getAppletIds(): EntryHashB64[] {
    return Object.keys(this._appletInfoCache);
  }


  /** -- Call & cache info  -- */

  /** */
  async assetInfo(wal: WAL): Promise<AssetLocationAndInfo | undefined> {
    const wurl = weaveUrlFromWal({hrl: wal.hrl});
    if (this._attachableInfoCache[wurl]) {
      return this._attachableInfoCache[wurl];
    }
    this._attachableInfoCache[wurl] = await this._inner.assetInfo(wal);
    return this._attachableInfoCache[wurl];
  }


  /** */
  async groupProfile(groupId: DnaHash): Promise<any> {
    const groupIdB64 = encodeHashToBase64(groupId);
    if (this._groupProfileCache[groupIdB64]) {
      return this._groupProfileCache[groupIdB64];
    }
    this._groupProfileCache[groupIdB64] = await this._inner.groupProfile(groupId);
    return this._groupProfileCache[groupIdB64];
  }


  /** */
  async appletInfo(appletHash: EntryHash): Promise<AppletInfo | undefined> {
    const appletId = encodeHashToBase64(appletHash);
    if (this._appletInfoCache[appletId]) {
      return this._appletInfoCache[appletId];
    }
    this._appletInfoCache[appletId] = await this._inner.appletInfo(appletHash);
    return this._appletInfoCache[appletId];
  }


  /** -- Passthrough  -- */

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
}
