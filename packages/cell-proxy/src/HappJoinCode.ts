import { decode, encode } from "@msgpack/msgpack";
import {InstalledAppId} from "@holochain/client";

export type HappJoinCode = {
  happSha256: string;
  happId: InstalledAppId;
  networkSeed: string;
};

/**  */
export function encodeHappJoinCode(happSha256: string, happId: InstalledAppId, networkSeed: string): string {
  const code: HappJoinCode = {happSha256, happId, networkSeed};
  const data = Array.from(encode(code));
  return btoa(String.fromCharCode.apply(null, data));
}


/** */
export function decodeHappJoinCode(shareCode: string): HappJoinCode {
  return decode(new Uint8Array(atob(shareCode).split("").map((c) => c.charCodeAt(0)))) as HappJoinCode;
}
