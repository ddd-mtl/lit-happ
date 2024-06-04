
import {
  HoloHashB64,
} from "@holochain/client";


/** */
export enum DatumValidity {
  None = "None",
  Self = "Self",
  Network = "Network",
}


/** */
export enum DatumStorageLocations {
  None = 0,
  Memory = 1 << 0,
  Disk = 1 << 1,
  SourceChain = 1 << 2,
  Cache = 1 << 3,
  Dht = 1 << 4,
}


/**
 *
 */
export class DatumMap<K extends HoloHashB64, V> {
  _map: Map<K, [V, DatumValidity, DatumStorageLocations]>;

  constructor(initialEntries?: Array<[K, V]>) {
    this._map = new Map();
    if (initialEntries) {
      for (const [key, value] of initialEntries) {
        this.set(key, value, DatumValidity.None, DatumStorageLocations.Memory);
      }
    }
  }

  has(key: K): boolean {
    return this._map.has(key);
  }

  getDetails(key: K): [V, DatumValidity, DatumStorageLocations] {
    return this._map.get(key);
  }

  get(key: K): V {
    return this._map.get(key)[0];
  }

  set(key: K, value: V, validity: DatumValidity, storage: DatumStorageLocations) {
    this._map.set(key, [value, validity, storage]);
  }

  delete(key: K) {
    return this._map.delete(key);
  }

  keys() {
    return this._map.keys()
  }

  values() {
    return Array.from(this._map.values()).map((tuple) => tuple[0]);
  }

  entries() {
    return Array.from(this._map.entries())
      .map(([h, v]) => [h, v[0]] as [K, V]);
  }

  clear() {
    return this._map.clear();
  }

  forEach(
    callbackfn: (value: V, key: K, map: Map<K, [V, DatumValidity, DatumStorageLocations]>) => void,
    thisArg?: any
  ): void {
    return this._map.forEach((value, key) => {
      callbackfn(value[0], key, this._map);
    }, thisArg);
  }

  get size() {
    return this._map.size;
  }

  // [Symbol.iterator](): IterableIterator<[K, V]> {
  //   return this.entries();
  // }

  get [Symbol.toStringTag](): string {
    return this._map[Symbol.toStringTag];
  }
}

// export class EntryHashMap<T> extends DatumMap<EntryHashB64, T> {}
// export class ActionHashMap<T> extends DatumMap<ActionHashB64, T> {}
// export class AgentPubKeyMap<T> extends DatumMap<AgentPubKeyB64, T> {}
// export class DnaHashMap<T> extends DatumMap<DnaHashB64, T> {}
