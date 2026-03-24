import { decode, encode } from "@msgpack/msgpack";
import {InstalledAppId} from "@holochain/client";

export type HappJoinInfo = {
  happSha256: string;
  happId: InstalledAppId;
  networkSeed: string;
  bootstrapUrls: string[];
  customName: string | undefined;
};

/**  */
export function encodeHappJoinInfo(happSha256: string, happId: InstalledAppId, networkSeed: string, bootstrapUrls: string[], customName?: string): string {
  const info: HappJoinInfo = {happSha256, happId, networkSeed, bootstrapUrls, customName};
  const encoded = encode(info);
  const data = Array.from(encoded) as number[];
  return btoa(String.fromCharCode.apply(null, data));
}


/** */
export function decodeHappJoinInfo(shareCode: string): HappJoinInfo {
  if (!shareCode || shareCode.length < 1) throw Error("decodeHappJoinInfo() invalid shareCode");
  return decode(new Uint8Array(atob(shareCode).split("").map((c) => c.charCodeAt(0)))) as HappJoinInfo;
}
