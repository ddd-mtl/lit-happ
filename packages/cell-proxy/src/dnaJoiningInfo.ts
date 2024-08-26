import { decode, encode } from "@msgpack/msgpack";

export type DnaJoiningInfo = {
  originalDnaHash: Uint8Array;
  name: string;
  networkSeed: string;
};

/** Encode a dna clone description as a base64 string for easily sharing */
export function encodeDnaJoiningInfo(originalDnaHash: Uint8Array, name: string, networkSeed: string): string {
  const info: DnaJoiningInfo = {originalDnaHash, name, networkSeed};
  const data = Array.from(encode(info));
  return btoa(String.fromCharCode.apply(null, data));
}


/** Decode base64 string back to clone description */
export function decodeDnaJoiningInfo(shareCode: string): DnaJoiningInfo {
  return decode(new Uint8Array(atob(shareCode).split("").map((c) => c.charCodeAt(0)))) as DnaJoiningInfo;
}
