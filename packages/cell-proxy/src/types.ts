import {CellId, InstalledAppId, InstalledCell, RoleId} from "@holochain/client";
import {AgentPubKeyB64, Dictionary, DnaHashB64} from "@holochain-open-dev/core-types";
import {AgentPubKey, DnaHash} from "@holochain/client/lib/types";
import {deserializeHash, serializeHash} from "@holochain-open-dev/utils";

/**
 *
 */
export interface IInstalledCell {
  get installedCell(): InstalledCell;
  get roleId(): RoleId;
  get dnaHash(): DnaHashB64;
  get agentPubKey(): AgentPubKeyB64;
  get cellId(): CellId;

  // get cloneName(): string;
  //get cellIndex(): CellIndex;
}


export type CellIndex = number;

export type CellMap = Dictionary<InstalledCell[]>;
//export type CellMap = Dictionary<InstalledCell>;

export type CellLocation = [InstalledAppId, RoleId, CellIndex];
//export type CellLocation = [InstalledAppId, RoleId]

export function CellLocation(installedAppId: InstalledAppId, roleId: RoleId): CellLocation {
  return [installedAppId, roleId, 0];
}

export type RoleInstanceId = string;
export function RoleInstanceId(roleId: RoleId, cellIndex: CellIndex) {
  return "" + roleId + "." + cellIndex
}

export function destructureRoleInstanceId(id: RoleInstanceId): [RoleId, CellIndex] {
  const subs = id.split(".");
  if (subs.length == 2) {
    //throw Error(`Bad RoleInstance id format: "${id}"`);
    return [id, 0];
  }
  return [subs[0] as RoleId, Number(subs[1]) as CellIndex];
}


/** HCL: Holochain Cell Locator */
export type HCL = string;
export function Hcl(loc_or_appId: InstalledAppId | CellLocation, roleId?: RoleId): HCL {
  if (Array.isArray(loc_or_appId)) {
    let hcl = "hcl://" + loc_or_appId[0] + "/" + loc_or_appId[1];
    //if (loc_or_appId[2] > 0) {
      hcl += "/" + loc_or_appId[2];
    //}
    return hcl;
  }
  if (!roleId) {
    throw Error("Hcl() failed. RoleId not provided");
  }
  return "hcl://" + loc_or_appId + "/" + roleId!;
}

const CELL_ID_SEPARATOR = "||"

export function CellIdStr(hash_or_id: DnaHash | CellId, key?: AgentPubKey): string {
  if (Array.isArray(hash_or_id)) {
    return "" + serializeHash(hash_or_id[0]) + CELL_ID_SEPARATOR + serializeHash(hash_or_id[1]);
  }
  if (!key) {
    throw Error("CellIdStr() failed. AgentPubKey not provided");
  }
  return "" + serializeHash(hash_or_id) + CELL_ID_SEPARATOR + serializeHash(key);
}

/** */
export function str2CellId(str: string): CellId {
  const subs = str.split(CELL_ID_SEPARATOR);
  if (subs.length != 2) {
    throw Error("str2CellId() failed. Bad input string format");
  }
  return [deserializeHash(subs[0]), deserializeHash(subs[1])]
}

