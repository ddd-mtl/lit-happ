import {CellId, InstalledAppId, InstalledCell, RoleId} from "@holochain/client";
import {AgentPubKeyB64, DnaHashB64} from "@holochain-open-dev/core-types";
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
}


export type CellLocation = [InstalledAppId, RoleId];


export function CellLocation(installedAppId: InstalledAppId, roleId: RoleId): CellLocation {
  return [installedAppId, roleId];
}


/** HCL: Holochain Cell Locator */
export type HCL = string;
export function Hcl(loc_or_appId: InstalledAppId | CellLocation, roleId?: RoleId): HCL {
  if (Array.isArray(loc_or_appId)) {
    return "hcl://" + loc_or_appId[0] + "/" + loc_or_appId[1];
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

