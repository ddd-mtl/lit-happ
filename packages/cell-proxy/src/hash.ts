import {decodeHashFromBase64, encodeHashToBase64, HoloHash, HoloHashB64} from "@holochain/client";
//import {AbstractConstructor, CellMixin, Empty, GConstructor, ZomeMixin, ZomeSpecific} from "./mixins";
//import {Cell} from "./cell";


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


/** ------------------------------------------------------------------------------------------------------------------*/

export enum HoloHashType {
  Action = "Action",
  Agent = "Agent",
  //DhtOp = "DhtOp",
  Dna = "Dna",
  Entry = "Entry",
  External = "External",
  Network = "Network",
  //Warrent = "Warrent",
  Wasm = "Wasm",
}

export const HASH_TYPE_PREFIX_B64 = {
  Action: "uhCkk",
  Agent: "uhCAk",
  Dna: "uhC0k",
  //DhtOp: "hCQk",
  Entry: "uhCEk",
  External: "uhC8k",
  Network: "uhCIk",
  //Warrent: "Warrent",
  Wasm: "uhCok",
};

export function getHashType(hash: HoloHashB64): HoloHashType {
  const hashExt = hash.slice(0, 5);
  const hashPrefixes = Object.values(HASH_TYPE_PREFIX_B64)
  for (let i = 0; i < hashPrefixes.length; i+= 1) {
    if (hashPrefixes[i] == hashExt) {
      return Object.keys(HASH_TYPE_PREFIX_B64)[i] as HoloHashType;
    }
  }
  throw Error("Unknown hash type");
}


/** */
export function isHashTypeB64(hash: HoloHashB64, hashType: HoloHashType) {
  const slice = hash.slice(0, 5);
  const prefix = HASH_TYPE_PREFIX_B64[hashType];
  for (let i = 0; i < prefix.length; i++) {
    if (slice[i] !== prefix[i]) {
      return false;
    }
  }
  return true;
}


export function hasHoloHashType(hash: HoloHashB64): boolean {
  return !!Object.values(HASH_TYPE_PREFIX_B64).find((prefix) => hash.startsWith(`${prefix}`));
}


/** */
export function validateHashB64(hash: HoloHashB64) {
  if (!hash || typeof(hash) != 'string') {
    throw new Error("The hash must be a valid string");
  }
  if (hash.length !== 53) {
    throw new Error("The hash must be exactly 53 characters long.");
  }
  if (!hasHoloHashType(hash)) {
    throw new Error("The hash must have a valid HoloHash type.");

  }
}


export function dec64(hash: HoloHashB64): HoloHash {
  validateHashB64(hash);
  return decodeHashFromBase64(hash);
}
export function enc64(hash: HoloHash): HoloHashB64 {
  let b64 = encodeHashToBase64(hash);
  validateHashB64(b64);
  return b64;
}


/** HoloHash starts with 'u' has a type and is 53 chars long */
export abstract class HolochainId {
  public readonly b64: HoloHashB64;
  //private readonly hash: HoloHash;

  /** Validate */
  constructor(input: HoloHashB64 | HoloHash, public readonly type: HoloHashType) {
    if (typeof(input) != 'string') {
      input = encodeHashToBase64(input);
    }
    validateHashB64(input);
    this.b64 = input;
  }

  get hash(): HoloHash { return dec64(this.b64) }
  /** First 8 chars of the Core */
  get short(): string { return this.b64.slice(5, 13); }

  toString(): string {return this.b64;}

  print(): string { return `${this.short} (${this.type})`}
}


/** Mixin */
export function createHolochainId(hashType: HoloHashType) {
  class AHoloId extends HolochainId {
    constructor(input: HoloHashB64 | HoloHash) {
      super(input, hashType);
      const type = getHashType(this.b64);
      if (hashType != type) {
        throw new Error('The hash does not have the correct type. Expected ' + hashType + ', got: ' + type);
      }
    }
  }
  /** */
  return AHoloId;
}

export class ActionId extends createHolochainId(HoloHashType.Action) {}
export class AgentId extends createHolochainId(HoloHashType.Agent) {}
export class DnaId extends createHolochainId(HoloHashType.Dna) {}
export class EntryId extends createHolochainId(HoloHashType.Entry) {}
export class ExternalId extends createHolochainId(HoloHashType.External) {}

export type AnyDhtId = ActionId | EntryId;
export type AnyLinkableId = AnyDhtId | ExternalId;


/** */
export function intoDhtId(input: HoloHashB64 | HoloHash): AnyDhtId {
  try {
    const actionId = new ActionId(input);
    return actionId;
  } catch(e) {
      const entryId = new EntryId(input);
      return entryId;
  }
}


/** */
export function intoLinkableId(input: HoloHashB64 | HoloHash): AnyLinkableId {
  try {
    const dhtId = intoDhtId(input);
    return dhtId;
  } catch(e) {
    const externalId = new ExternalId(input);
    return externalId;
  }
}
