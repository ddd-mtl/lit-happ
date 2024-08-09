import {decode, encode, ExtensionCodec} from "@msgpack/msgpack";
// @ts-ignore
import blake2b from "@bitgo/blake2b";
import { Base64 } from "js-base64";
import {
  ActionHashB64,
  AgentPubKeyB64,
  EntryHashB64, HASH_TYPE_PREFIX,
  HoloHashB64, randomByteArray,
} from "@holochain/client";
import {getIndexByVariant} from "./utils";


/**
 * Checks if obj is a Hash or list of hashes and tries to convert it a B64 or list of B64
 */
export function anyToB64(obj: unknown): unknown {
  /** Check if it's a hash */
  if (obj instanceof Uint8Array) {
    return enc64(obj);
  } else {
    /** Check if it's an array of hashes */
    if (Array.isArray(obj)) {
      const isUint8Array =
        obj.length > 0 &&
        obj.every((value) => {
          return value instanceof Uint8Array;
        });
      if (isUint8Array) {
        let result: any[] = [];
        for (const cur of obj) {
          result.push(enc64(cur));
        }
        return result;
      }
    }
  }
  return obj;
}


/** ------------------------------------------------------------------------------------------------------------------*/

function decodeHashFromBase64(hash: HoloHashB64): Uint8Array {
  return Base64.toUint8Array(hash.slice(1));
}


function encodeHashToBase64(hash: Uint8Array): HoloHashB64 {
  return `u${Base64.fromUint8Array(hash, true)}`;
}


export function dhtLocationFrom32(hashCore: Uint8Array): Uint8Array {
  if (hashCore.length != 32) {
    throw Error("Uint8Array length must be exactly 32");
  }
  const hash = new Uint8Array(16);
  blake2b(hash.length).update(hashCore).digest(hash);

  const out = hash.slice(0, 4)!;
  [4, 8, 12].forEach((i) => {
    out[0]! ^= hash[i]!;
    out[1]! ^= hash[i + 1]!;
    out[2]! ^= hash[i + 2]!;
    out[3]! ^= hash[i + 3]!;
  });

  return out;
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
    throw new Error("The hash must have a valid HoloHashB64 type.");
  }
}


export function dec64(hash: HoloHashB64): Uint8Array {
  validateHashB64(hash);
  return decodeHashFromBase64(hash);
}

export function enc64(hash: Uint8Array): HoloHashB64 {
  let b64 = encodeHashToBase64(hash);
  validateHashB64(b64);
  return b64;
}

function isUint8Array(value: any): boolean {
  return value instanceof Uint8Array;
}

/** A HoloHash starts with 'u' has a type and is 53 chars long */
export abstract class HolochainId {
  public readonly b64: HoloHashB64;

  static readonly HASH_TYPE: HoloHashType;

  get hashType(): HoloHashType {
    return (this.constructor as typeof HolochainId).HASH_TYPE;
  }

  /** ctor: validate */
  constructor(input: HoloHashB64 | Uint8Array) {
    if (typeof(input) != 'string') {
      input = encodeHashToBase64(input);
    }
    validateHashB64(input, this.hashType);
    this.b64 = input;
  }

  /** */
  equals<T extends HolochainId>(other: T | Uint8Array | string): boolean {
    //console.log("equals", other, isUint8Array(other));
    if (!other) {
      return false;
    }
    let b64;
    if (typeof(other) == 'string') {
      b64 = other;
    } else {
      if (isUint8Array(other)) {
        b64 = enc64(other as Uint8Array);
      } else {
        b64 = (other as T).b64;
      }
    }
    return b64 == this.b64;
  }


  /** */
  static empty<T extends HolochainId>(this: new (input: HoloHashB64 | Uint8Array) => T, byte?: number): T {
    const empty = new Uint8Array(32);
    byte = byte? byte : 0;
    empty.fill(byte);
    const hashType = (this as unknown as typeof HolochainId).HASH_TYPE;
    const newHash = retypeHoloHashArray(empty, hashType);
    return new this(newHash);
  }


  /** */
  static from<T extends HolochainId, Z extends HolochainId>(this: new (input: HoloHashB64 | Uint8Array) => Z, start: T | string): Z {
    let hash;
    if (typeof start == 'string') {
      hash = dec64(start);
    } else {
      hash = start.hash;
    }
    const core = Uint8Array.from(hash.slice(3, 35));
    const hashType = (this as unknown as typeof HolochainId).HASH_TYPE;
    const newHash = retypeHoloHashArray(core, hashType);
    return new this(newHash);
  }


  /** */
  static async random<T extends HolochainId>(this: new (input: HoloHashB64 | Uint8Array) => T): Promise<T> {
    const core = await randomByteArray(32);
    const hashType = (this as unknown as typeof HolochainId).HASH_TYPE;
    const newHash = retypeHoloHashArray(core, hashType);
    return new this(newHash);
  }


  // Don't autoconvert to string as this can lead to confusions. Have convert to string be explicit
  toString(): string {throw Error("Implicit conversion of HolochainId to string")}

  //toString(): string {return this.b64;}

  get hash(): Uint8Array { return dec64(this.b64) }
  /** First 8 chars of the Core */
  get short(): string { return this.b64.slice(5, 13); }

  print(): string { return `${this.short} (${this.hashType})`}
}


/** */
function retypeHoloHashArray(core: Uint8Array, hashType: HoloHashType): Uint8Array {
  if (hashType == HoloHashType.Network || hashType == HoloHashType.Wasm) {
    throw Error("HoloHashType not handled");
  }
  return Uint8Array.from([
    ...HASH_TYPE_PREFIX[hashType],
    ...core,
    ...dhtLocationFrom32(core),
  ]);
}



export class ActionId extends HolochainId { static override readonly HASH_TYPE = HoloHashType.Action; action() {} }
export class AgentId extends HolochainId { static override readonly HASH_TYPE = HoloHashType.Agent; agent() {} }
export class EntryId extends HolochainId { static override readonly HASH_TYPE = HoloHashType.Entry; entry() {} }
export class DnaId extends HolochainId { static override readonly HASH_TYPE = HoloHashType.Dna; dna() {} }
export class ExternalId extends HolochainId { static override readonly HASH_TYPE = HoloHashType.External; external() {} }

//export class AnyId extends HolochainId { static readonly HASH_TYPE = HoloHashType.Any; any() {} }

export type DhtId = ActionId | EntryId;
export type LinkableId = DhtId | ExternalId;
export type AnyId = LinkableId | AgentId | DnaId;




/** */
export function intoDhtId(input: HoloHashB64 | Uint8Array): DhtId {
  try {
    const actionId = new ActionId(input);
    return actionId;
  } catch(e) {
      const entryId = new EntryId(input);
      return entryId;
  }
}


/** */
export function intoLinkableId(input: HoloHashB64 | Uint8Array): LinkableId {
  try {
    const dhtId = intoDhtId(input);
    return dhtId;
  } catch(e) {
    const externalId = new ExternalId(input);
    return externalId;
  }
}


/** */
export function intoAnyId(input: HoloHashB64 | Uint8Array): AnyId {
  try {
    const dhtId = intoLinkableId(input);
    return dhtId;
  } catch(e) {
    try {
      const dnaId = new AgentId(input);
      return dnaId;
    } catch(e) {
      const id = new DnaId(input);
      return id;
    }
  }
}


/** -- JSON -- */

export function holoIdReviver(_key: any, value: any) {
  if(typeof value === 'object' && value !== null) {
    // if (value.dataType === 'HolochainId') {
    //   return intoAnyId(value.value);
    // }
    const keys = Object.keys(value);
    if (keys.length == 1 && keys[0] == "b64") {
      return intoAnyId(value.b64);
    }
  }
  return value;
}


/** -- MsgPack ExtensionCodec for HolochainId -- */

export const HOLOCHAIN_ID_EXT_CODEC = new ExtensionCodec();

HOLOCHAIN_ID_EXT_CODEC.register({
  type: getIndexByVariant(HoloHashType, HoloHashType.Agent),
  encode: (object: unknown): Uint8Array | null => {
    if (object instanceof AgentId) {
      return encode(object.b64);
    } else {
      return null;
    }
  },
  decode: (data: Uint8Array) => {
    const b64 = decode(data) as AgentPubKeyB64;
    return new AgentId(b64);
  },
});

HOLOCHAIN_ID_EXT_CODEC.register({
  type: getIndexByVariant(HoloHashType, HoloHashType.Entry),
  encode: (object: unknown): Uint8Array | null => {
    if (object instanceof EntryId) {
      return encode(object.b64);
    } else {
      return null;
    }
  },
  decode: (data: Uint8Array) => {
    const b64 = decode(data) as EntryHashB64;
    return new EntryId(b64);
  },
});


HOLOCHAIN_ID_EXT_CODEC.register({
  type: getIndexByVariant(HoloHashType, HoloHashType.Action),
  encode: (object: unknown): Uint8Array | null => {
    if (object instanceof ActionId) {
      return encode(object.b64);
    } else {
      return null;
    }
  },
  decode: (data: Uint8Array) => {
    const b64 = decode(data) as ActionHashB64;
    return new ActionId(b64);
  },
});

HOLOCHAIN_ID_EXT_CODEC.register({
  type: getIndexByVariant(HoloHashType, HoloHashType.Dna),
  encode: (object: unknown): Uint8Array | null => {
    if (object instanceof DnaId) {
      return encode(object.b64);
    } else {
      return null;
    }
  },
  decode: (data: Uint8Array) => {
    const b64 = decode(data) as ActionHashB64;
    return new DnaId(b64);
  },
});


/** -- TESTING -- */

/** */
export async function testHoloId() {
  console.log("testHoloId()");
  const emptyAction = ActionId.empty();
  const emptyEntry = EntryId.empty();
  const emptyAgent = AgentId.from(emptyEntry);
  const emptyEntry2 = EntryId.from(emptyAgent);
  const randomEh = await EntryId.random();
  const randomEh2 = EntryId.from(randomEh.b64);

  console.log("testHoloId()", emptyAction);
  /** */
  function printEh(eh: EntryId) {
    console.log("printEh", eh);
  }

  printEh(emptyEntry);
  printEh(emptyEntry2);
  printEh(randomEh);
  console.log("testHoloId.emptyEntry", emptyEntry.equals(emptyEntry), emptyEntry.equals(emptyEntry.b64), emptyEntry.equals(emptyEntry.hash));
  console.log("testHoloId.emptyEntry2", emptyEntry.equals(emptyEntry2), emptyEntry.equals(emptyEntry2.b64), emptyEntry.equals(emptyEntry2.hash));
  console.log("testHoloId.randomEh", emptyEntry.equals(randomEh), emptyEntry.equals(emptyAgent), emptyEntry.equals(emptyAgent.hash), emptyEntry.equals(emptyAgent.b64));
  console.log("testHoloId.randomEh2", randomEh.equals(randomEh2));

  //printEh(emptyAction); // Should error at compile time
}

