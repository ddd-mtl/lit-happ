import {HoloHashB64, ZomeName} from "@holochain/client";

export declare type AnyLinkableHashB64 = HoloHashB64;

export interface FlatScopedLinkType {
  zomeIndex: number,
  linkIndex: number,
}


/** */
export function linkType2str(slt: FlatScopedLinkType): string {
  return "[" + slt.zomeIndex + ":" + slt.linkIndex + "]";
}


/** */
export function linkType2NamedStr(slt: FlatScopedLinkType, zomeNames: ZomeName[]): string {
  return `${zomeNames[slt.zomeIndex]} [${slt.zomeIndex}; ${slt.linkIndex}]`;
}


/** */
export function utf32Decode(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let result = '';

  for (let i = 0; i < bytes.length; i += 4) {
    result += String.fromCodePoint(view.getInt32(i, true));
  }

  return result;
}
