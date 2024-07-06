import {
  decodeHashFromBase64,
  dhtLocationFrom32,
  encodeHashToBase64, HASH_TYPE_PREFIX,
  HoloHash,
  HoloHashB64,
  } from "@holochain/client";

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
export function validateHashB64(hash: HoloHashB64, hashType?: HoloHashType) {
  if (!hash || typeof(hash) != 'string') {
    throw new Error("The hash must be a valid string");
  }
  if (hash.length !== 53) {
    throw new Error("The hash must be exactly 53 characters long. Got: " + hash.length);
  }
  if(hashType && !hasHoloHashType(hashType) || !hasHoloHashType(hash)) {
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

  static readonly HASH_TYPE: HoloHashType;

  get hashType(): HoloHashType {
    return (this.constructor as typeof HolochainId).HASH_TYPE;
  }

  /** Validate */
  constructor(input: HoloHashB64 | HoloHash) {
    if (typeof(input) != 'string') {
      input = encodeHashToBase64(input);
    }
    console.log("HolochainId.ctor()", HolochainId.HASH_TYPE, this.hashType)
    validateHashB64(input, this.hashType);
    this.b64 = input;
  }

  toString(): string {return this.b64;}

  get hash(): HoloHash { return dec64(this.b64) }
  /** First 8 chars of the Core */
  get short(): string { return this.b64.slice(5, 13); }

  print(): string { return `${this.short} (${this.hashType})`}

  static empty<T extends HolochainId>(): T {
    const hashType = (this.constructor as typeof HolochainId).HASH_TYPE;
    const empty = new Uint8Array(32);
    const newHash = Uint8Array.from([
      ...HASH_TYPE_PREFIX[hashType],
      ...empty,
      ...dhtLocationFrom32(empty),
    ]);
    return this.constructor(newHash) as T;
  }

  static from<T extends HolochainId, Z extends HolochainId>(start: T): Z {
    const hashType = (this.constructor as typeof HolochainId).HASH_TYPE;
    const core = Uint8Array.from(start.hash.slice(3, 35));
    const newHash = Uint8Array.from([
      ...HASH_TYPE_PREFIX[hashType],
      ...core,
      ...dhtLocationFrom32(core),
    ]);
    return this.constructor(newHash) as Z;
  }
}



// /** Mixin */
// export function createHolochainId(hashType: HoloHashType) {
//   abstract class AHoloId extends HolochainId {
//     constructor(input: HoloHashB64 | HoloHash) {
//       super(input, hashType);
//       const type = getHashType(this.b64);
//       if (hashType != type) {
//         throw new Error('The hash does not have the correct type. Expected ' + hashType + ', got: ' + type);
//       }
//     }
//     /** */
//     static empty<T extends AHoloId>(): T {
//       const empty = new Uint8Array(32);
//       const newHash = Uint8Array.from([
//         ...HASH_TYPE_PREFIX[hashType],
//         ...empty,
//         ...dhtLocationFrom32(empty),
//       ]);
//       return new AHoloId(newHash) as T;
//     }
//     /** */
//     static from<T extends AHoloId, Z extends AHoloId>(start: T): Z {
//       const core = Uint8Array.from(start.hash.slice(3, 35));
//       const newHash = Uint8Array.from([
//         ...HASH_TYPE_PREFIX[hashType],
//         ...core,
//         ...dhtLocationFrom32(core),
//       ]);
//       return new AHoloId(newHash) as Z;
//     }

//   }
//   /** */
//   return AHoloId;
// }

// export class ActionId extends createHolochainId(HoloHashType.Action) { action() {} }
// export class AgentId extends createHolochainId(HoloHashType.Agent) { agent() {} }
// export class DnaId extends createHolochainId(HoloHashType.Dna) { dna() {}}
// export class EntryId extends createHolochainId(HoloHashType.Entry) { entry() {} }
// export class ExternalId extends createHolochainId(HoloHashType.External) { external() {}}

export class ActionId extends HolochainId { static readonly HASH_TYPE = HoloHashType.Action; action() {} }
export class AgentId extends HolochainId { static readonly HASH_TYPE = HoloHashType.Agent; agent() {} }
export class EntryId extends HolochainId { static readonly HASH_TYPE = HoloHashType.Entry; entry() {} }
export class DnaId extends HolochainId { static readonly HASH_TYPE = HoloHashType.Dna; dna() {} }
export class ExternalId extends HolochainId { static readonly HASH_TYPE = HoloHashType.External; external() {} }


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


/** */
export function testHoloId() {
  console.log("testHoloId()");
  const emptyAgent: AgentId = AgentId.empty();
  const emptyAction: ActionId = ActionId.empty();
  const emptyEntry: EntryId = EntryId.from(emptyAgent);

  console.log("testHoloId()", emptyAction);
  /** */
  function printEh(eh: EntryId) {
    console.log("printEh", eh);
  }

  printEh(emptyEntry);
}

