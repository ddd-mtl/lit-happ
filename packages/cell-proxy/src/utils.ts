import {CellId} from "@holochain/client";


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

/** convert Pascal case to snake case */
export const snake = str => str[0].toLowerCase() + str.slice(1, str.length).replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

/** convert snake case to pascal case */
export const pascal = str => str[0].toUpperCase() + str.slice(1, str.length).replace(/_([a-z])/g, letter => `${letter[1].toUpperCase()}`);


/** enumType = enum or Object.values(enum) */
export function getVariantByIndex(enumType: Object | string[], index: number): string {
  let keys = enumType as string[];
  if (!Array.isArray(enumType)) {
    keys = Object.keys(enumType);
  }
  if (index >= 0 && index < keys.length) {
    const key = keys[index];
    return enumType[key];
  }
  throw Error("Out of bounds index");
}


/** enumType = enum or Object.values(enum) */
export function getIndexByVariant(enumType: Object | string[], value: string): number {
  let variants = enumType as string[];
  if (!Array.isArray(enumType)) {
    variants = Object.keys(enumType).filter(key => isNaN(Number(key))); // Filter out numeric keys if present
  }
  for (let i = 0; i < variants.length; i++) {
    if (variants[i] === value) {
      return i;
    }
  }
  throw Error("Unknown variant");
}
