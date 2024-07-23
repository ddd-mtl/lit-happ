

export declare type Dictionary<T> = {
  [key: string]: T;
};


/** */
export function assertIsDefined<T>(value: T | undefined): asserts value is T {
  if (value === undefined) {
    throw new Error('Value is undefined');
  }
}


/** */
export function assertAllDefined(...args: any[]): void {
  for (const arg of args) {
    if (arg === undefined) {
      throw new Error('One or more arguments are undefined');
    }
  }
}


/** */
export function areArraysEqual(first: Uint8Array, second: Uint8Array) {
  return first.length === second.length && first.every((value, index) => value === second[index])
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
