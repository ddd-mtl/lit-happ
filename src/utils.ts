import {serializeHash} from "@holochain-open-dev/utils";

/**  */
export const delay = (ms:number) => new Promise(r => setTimeout(r, ms))


/**
 * Checks if obj is a Hash or list of hashes and tries to convert it a B64 or list of B64
 */
  export function anyToB64(obj: any): any {
  /** Check if it's a hash */
  if (obj instanceof Uint8Array) {
    return serializeHash(obj);
  } else {
    /** Check if its an array of hashes */
    if (Array.isArray(obj)) {
      const isUint8Array =
        obj.length > 0 &&
        obj.every((value) => {
          return value instanceof Uint8Array;
        });
      if (isUint8Array) {
        let result = [];
        for (const cur of obj) {
          result.push(serializeHash(cur));
        }
        return result;
      }
    }
  }
  return obj;
}