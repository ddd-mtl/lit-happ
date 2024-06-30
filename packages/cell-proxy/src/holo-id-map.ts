import {
  HoloHashB64,
} from "@holochain/client";
import {ActionId, AgentId, DnaId, EntryId, HoloId} from "./hash";
import {GConstructor} from "./mixins";


export class HoloIdMap<K extends HoloId, V> implements Map<K, V> {
  _map: Map<HoloHashB64, V>;

  constructor(private _ctor: GConstructor<K>, initialEntries?: Array<[K, V]>) {
    this._map = new Map();
    if (initialEntries) {
      for (const [key, value] of initialEntries) {
        this.set(key, value);
      }
    }
  }

  has(key: K) {
    return this._map.has(key.b64);
  }

  get(key: K): V {
    return this._map.get(key.b64);
  }

  set(key: K, value: V) {
    this._map.set(key.b64, value);
    return this;
  }

  delete(key: K) {
    return this._map.delete(key.b64);
  }

  values() {
    return this._map.values();
  }

  keys() {
    return Array.from(this._map.keys())
      .map((h) => new this._ctor(h))
      [Symbol.iterator]();
  }

  entries() {
    return Array.from(this._map.entries())
      .map(([h, v]) => [new this._ctor(h), v] as [K, V])
      [Symbol.iterator]();
  }

  clear() {
    return this._map.clear();
  }

  forEach(
    callbackfn: (value: V, key: K, map: Map<K, V>) => void,
    thisArg?: any
  ): void {
    return this._map.forEach((value, key) => {
      callbackfn(value, new this._ctor(key), this);
    }, thisArg);
  }

  get size() {
    return this._map.size;
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries();
  }

  get [Symbol.toStringTag](): string {
    return this._map[Symbol.toStringTag];
  }
}



export class ActionIdMap<T> extends HoloIdMap<ActionId, T>  {
  constructor(initialEntries?: Array<[ActionId, T]>) {
    super(ActionId, initialEntries)
  }
}

export class AgentIdMap<T> extends HoloIdMap<AgentId, T>  {
  constructor(initialEntries?: Array<[AgentId, T]>) {
    super(AgentId, initialEntries)
  }
}

export class DnaIdMap<T> extends HoloIdMap<DnaId, T> {
  constructor(initialEntries?: Array<[DnaId, T]>) {
    super(DnaId, initialEntries)
  }
}

export class EntryIdMap<T> extends HoloIdMap<EntryId, T>  {
  constructor(initialEntries?: Array<[EntryId, T]>) {
    super(EntryId, initialEntries)
  }
}
