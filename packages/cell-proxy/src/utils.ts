import {CellId, AppInfo, CellInfo, Cell, encodeHashToBase64} from "@holochain/client";
import {IInstalledCell} from "./types";
import {CellType, DnaModifiers} from "@holochain/client";


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


/** ... */
export function intoCell(cellInfo: CellInfo): Cell | undefined {
  if (CellType.Stem in cellInfo) {
    return undefined;
  }
  if (CellType.Cloned in cellInfo) {
    return cellInfo.Cloned;
  }
  if (CellType.Provisioned in cellInfo) {
    return cellInfo.Provisioned;
  }
  return undefined;
}


/** */
export function printAppInfo(appInfo: AppInfo): string {
  let print = `Happ "${appInfo.installed_app_id}" info: (status: ${JSON.stringify(appInfo.status)})`;
  for (const [role_name, cellInfos] of Object.values(appInfo.cell_info)) {
    for (const cellInfo of  Object.values(cellInfos)) {
      if (CellType.Stem in cellInfo) {
        print += `\n - ${role_name}.${cellInfo.name? cellInfo.name : "unnamed"} : ${encodeHashToBase64(cellInfo.dna)} (stem)`;
        continue;
      }
      const cell = intoCell(cellInfo)!;
      print += `\n - ${role_name}.${cell.name}${cell.name? "."+cell.name : ""} : ${encodeHashToBase64(cell.cell_id[0])}`;
    }
  }
  return print;
}


/** */
export function printInstalledCell(installedCell: IInstalledCell): string {
  return `InstalledCell "${installedCell.roleInstanceId}": ${installedCell.dnaHash}`;
}


/** -- Experimental -- */

/**
 *
 */
export class Queue<T> {
  private _store: T[] = [];

  get length(): number {return this._store.length}

  push(val: T) {
    this._store.push(val);
  }
  pop(): T | undefined {
    return this._store.shift();
  }

  isEmpty(): boolean { return this._store.length == 0}
}
