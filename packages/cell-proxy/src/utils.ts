import {CellId, AppInfo, encodeHashToBase64} from "@holochain/client";
import {CellType} from "@holochain/client";
import {Cell, intoStem} from "./cell";


export declare type Dictionary<T> = {
  [key: string]: T;
};

/** */
export function areArraysEqual(first: Uint8Array, second: Uint8Array) {
  return first.length === second.length && first.every((value, index) => value === second[index])
}

/** */
export function areCellsEqual(cellA: CellId, cellB: CellId) {
  return areArraysEqual(cellA[0], cellB[0]) && areArraysEqual(cellA[1], cellB[1])
}

/**  */
export const delay = (ms: number) => new Promise(r => setTimeout(r, ms))


/**
 * Checks if obj is a Hash or list of hashes and tries to convert it a B64 or list of B64
 */
export function anyToB64(obj: any): any {
  /** Check if it's a hash */
  if (obj instanceof Uint8Array) {
    return encodeHashToBase64(obj);
  } else {
    /** Check if it's an array of hashes */
    if (Array.isArray(obj)) {
      const isUint8Array =
        obj.length > 0 &&
        obj.every((value) => {
          return value instanceof Uint8Array;
        });
      if (isUint8Array) {
        let result = [];
        for (const cur of obj) {
          result.push(encodeHashToBase64(cur));
        }
        return result;
      }
    }
  }
  return obj;
}

/** -- Pretty print -- */

const zeroPad = (num: number, places: number) => String(num).padStart(places, '0')

export function prettyDuration(date: Date): string {
  return date.getSeconds() + "." + zeroPad(date.getMilliseconds(), 3)
}

/** */
export function prettyDate(date: Date): string {
  return ""
    + zeroPad(date.getHours(), 2)
    + ":" + zeroPad(date.getMinutes(), 2)
    + ":" + zeroPad(date.getSeconds(), 2)
    + "." + zeroPad(date.getMilliseconds(), 3);
}



/** */
export function printAppInfo(appInfo: AppInfo): string {
  let print = `Happ "${appInfo.installed_app_id}" info: (status: ${JSON.stringify(appInfo.status)})`;
  for (const [roleName, cellInfos] of Object.entries(appInfo.cell_info)) {
    for (const cellInfo of  Object.values(cellInfos)) {
      if (CellType.Stem in cellInfo) {
        const stem = intoStem(cellInfo)!;
        print += `\n - ${roleName}.${stem.name? stem.name : "unnamed"}: ${encodeHashToBase64(stem.dna)} (stem)`;
        continue;
      }
      if (CellType.Provisioned in cellInfo) {
        const cell = this.provisioned;
        print += `\n - ${roleName}.${cell.name}: ${encodeHashToBase64(cell.cell_id[0])}`;
        continue;
      }
      if (CellType.Cloned in cellInfo) {
        const cell = this.cloned;
        print += `\n - ${roleName}.${cell.name}: ${encodeHashToBase64(cell.cell_id[0])}`;
        continue;
      }
    }
  }
  return print;
}
