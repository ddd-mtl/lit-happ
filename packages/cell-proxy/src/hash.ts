import {
  decodeHashFromBase64,
  dhtLocationFrom32,
  encodeHashToBase64, HASH_TYPE_PREFIX,
  HoloHash,
  HoloHashB64, randomByteArray,
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
  if((hashType && !isHashTypeB64(hash, hashType)) || !hasHoloHashType(hash)) {
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



/** A HoloHash starts with 'u' has a type and is 53 chars long */
export abstract class HolochainId {
  public readonly b64: HoloHashB64;

  static readonly HASH_TYPE: HoloHashType;

  get hashType(): HoloHashType {
    return (this.constructor as typeof HolochainId).HASH_TYPE;
  }

  /** ctor: validate */
  constructor(input: HoloHashB64 | HoloHash) {
    if (typeof(input) != 'string') {
      input = encodeHashToBase64(input);
    }
    validateHashB64(input, this.hashType);
    this.b64 = input;
  }

  /** */
  static empty<T extends HolochainId>(this: new (input: HoloHashB64 | HoloHash) => T, byte?: number): T {
    const empty = new Uint8Array(32);
    byte = byte? byte : 0;
    empty.fill(byte);
    const newHash = Uint8Array.from([
      ...HASH_TYPE_PREFIX[(this as unknown as typeof HolochainId).HASH_TYPE],
      ...empty,
      ...dhtLocationFrom32(empty),
    ]);
    return new this(newHash);
  }

  /** */
  static from<T extends HolochainId, Z extends HolochainId>(this: new (input: HoloHashB64 | HoloHash) => Z, start: T): Z {
    const core = Uint8Array.from(start.hash.slice(3, 35));
    const hashType = (this as unknown as typeof HolochainId).HASH_TYPE;
    const newHash = Uint8Array.from([
      ...HASH_TYPE_PREFIX[hashType],
      ...core,
      ...dhtLocationFrom32(core),
    ]);
    return new this(newHash);
  }


  /** */
  static async random<T extends HolochainId>(this: new (input: HoloHashB64 | HoloHash) => T): Promise<T> {
    const core = await randomByteArray(32);
    const newHash = Uint8Array.from([
      ...HASH_TYPE_PREFIX[(this as unknown as typeof HolochainId).HASH_TYPE],
      ...core,
      ...dhtLocationFrom32(core),
    ]);
    return new this(newHash);
  }


  // Don't autoconvert to string as this can lead to confusions. Have convert to string be explicit
  toString(): string {throw Error("Implicit conversion of HolochainId to string")}

  //toString(): string {return this.b64;}

  get hash(): HoloHash { return dec64(this.b64) }
  /** First 8 chars of the Core */
  get short(): string { return this.b64.slice(5, 13); }

  print(): string { return `${this.short} (${this.hashType})`}
}


export class ActionId extends HolochainId { static readonly HASH_TYPE = HoloHashType.Action; action() {} }
export class AgentId extends HolochainId { static readonly HASH_TYPE = HoloHashType.Agent; agent() {} }
export class EntryId extends HolochainId { static readonly HASH_TYPE = HoloHashType.Entry; entry() {} }
export class DnaId extends HolochainId { static readonly HASH_TYPE = HoloHashType.Dna; dna() {} }
export class ExternalId extends HolochainId { static readonly HASH_TYPE = HoloHashType.External; external() {} }

//export class AnyId extends HolochainId { static readonly HASH_TYPE = HoloHashType.Any; any() {} }

export type DhtId = ActionId | EntryId;
export type LinkableId = DhtId | ExternalId;
export type AnyId = LinkableId | AgentId | DnaId;


/** */
export function intoDhtId(input: HoloHashB64 | HoloHash): DhtId {
  try {
    const actionId = new ActionId(input);
    return actionId;
  } catch(e) {
      const entryId = new EntryId(input);
      return entryId;
  }
}


/** */
export function intoLinkableId(input: HoloHashB64 | HoloHash): LinkableId {
  try {
    const dhtId = intoDhtId(input);
    return dhtId;
  } catch(e) {
    const externalId = new ExternalId(input);
    return externalId;
  }
}


/** */
export async function testHoloId() {
  console.log("testHoloId()");
  const emptyAction = ActionId.empty();
  const emptyEntry = EntryId.empty();
  const emptyAgent = AgentId.from(emptyEntry);
  const emptyEntry2 = EntryId.from(emptyAgent);
  const randomEh = await EntryId.random();

  console.log("testHoloId()", emptyAction);
  /** */
  function printEh(eh: EntryId) {
    console.log("printEh", eh);
  }

  printEh(emptyEntry);
  printEh(emptyEntry2);
  printEh(randomEh);
  //printEh(emptyAction); // Should error at compile time
}

