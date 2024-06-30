import {decodeHashFromBase64, encodeHashToBase64, HoloHash, HoloHashB64} from "@holochain/client";
import {AbstractConstructor, CellMixin, Empty, GConstructor, ZomeMixin, ZomeSpecific} from "./mixins";
import {Cell} from "./cell";


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
export abstract class HoloId {
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

  print(): string { return `${this.short} (${this.type})`}
}


export function createHolodId(hashType: HoloHashType) {
  class AHoloId extends HoloId {
    constructor(input: HoloHashB64 | HoloHash) {
      super(input, hashType);
      const type = getHashType(this.b64);
      if (hashType != type) {
        throw new Error('The hash does not have the correct type. Expected ' + hashType + ', got' + type);
      }
    }
  }
  /** */
  return AHoloId;
}

export class ActionId extends createHolodId(HoloHashType.Action) {}
export class AgentId extends createHolodId(HoloHashType.Agent) {}
export class DnaId extends createHolodId(HoloHashType.Dna) {}
export class EntryId extends createHolodId(HoloHashType.Entry) {}
export class ExternalId extends createHolodId(HoloHashType.External) {}


//
// /** */
// export class DnaId extends HoloId {
//   constructor(input: HoloHashB64 | HoloHash) {
//     super(input, HoloHashType.Dna);
//     const type = getHashType(this.value);
//     if (HoloHashType.Dna != type) {
//       throw new Error('The hash does not have the "Dna" type');
//     }
//   }
// }
//
//
// /** */
// export class AgentId extends HoloId {
//   constructor(input: HoloHashB64 | HoloHash) {
//     super(input, HoloHashType.Agent);
//     const type = getHashType(this.value);
//     if (HoloHashType.Agent != type) {
//       throw new Error('The hash does not have the "Agent" type');
//     }
//   }
// }


/** ------- */
// export type HoloIdConstructor<T = {}> = new (input: HoloHashB64 | HoloHash) => T;
//
// export function HoloIdMixin<TBase extends GConstructor>(Base: TBase) {
//   class AHoloId extends Base {
//     public readonly b64: HoloHashB64;
//
//     //constructor(...args: any[]) {super(args[0])}
//
//     /** Validate */
//     constructor(...args: any[]) {
//       super(args);
//       if (args.length != 1) {
//         throw new Error("HoloId ctor must have exactly 1 argument.");
//       }
//       let input = args[0];
//       if (typeof (input) != 'string') {
//         input = enc64(input);
//       }
//       this.b64 = input;
//       if (this.b64.length !== 53) {
//         throw new Error("The hash must be exactly 53 characters long.");
//       }
//     }
//
//     get hash(): HoloHash {
//       return dec64(this.b64)
//     }
//
//     /** First 8 chars of the Core */
//     get short(): string {
//       return this.b64.slice(5, 13);
//     }
//   }
//   return AHoloId;
// }
//
// export const HoloId = HoloIdMixin(Empty);
//
//
// /** */
// export class AgentId extends HoloId {
//   constructor(input: HoloHashB64 | HoloHash) {
//     super(input, HoloHashType.Agent);
//     const type = getHashType(this.b64);
//     if (HoloHashType.Agent != type) {
//       throw new Error('The hash does not have the correct type: ' + HoloHashType.Agent);
//     }
//   }
// }
//
//
// /** */
// export class DnaId extends HoloIdMixin(Empty) {
//   constructor(input: HoloHashB64 | HoloHash) {
//     super(input, HoloHashType.Dna);
//     const type = getHashType(this.b64);
//     if (HoloHashType.Dna != type) {
//       throw new Error('The hash does not have the correct type: ' + HoloHashType.Dna);
//     }
//   }
// }
