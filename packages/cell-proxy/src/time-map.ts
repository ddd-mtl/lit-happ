
/**
 * Insert items in time buckets.
 * On Insert oldest item is deleted if max map size is reached.
 */
export class TimeMap<N extends number, V> {
  private _map: Map<number, Set<V>>;
  private readonly _blockSize: number;
  //private readonly _mapSize: number;

  constructor(blockSizeMs: number, private readonly _mapSize: N) {
    this._map  = new Map();
    this._blockSize = blockSizeMs;
  }


  private getNowKey(): number {
    const now = Date.now();
    const bucket = Math.floor(now / this._blockSize);
    return bucket;
  }

  add(value: V) {
    const bucket = this.getNowKey();
    const maybe = this._map.get(bucket);
    let sett = new Set<V>();
    if (maybe) {
      sett = maybe;
    }
    sett.add(value);
    /* Remove the oldest entry (first inserted entry) */
    if (this._map.size >= this._mapSize) {
      const oldestKey = this._map.keys().next().value;
      this._map.delete(oldestKey);
    }
    /* */
    this._map.set(bucket, sett);
  }


  has(value: V): boolean {
    const bucket = this.getNowKey();
    const maybe = this._map.get(bucket);
    if (maybe && maybe.has(value)) {
      return true;
    }
    const bucketMinus = bucket - 1;
    const maybeMinus = this._map.get(bucketMinus);
    if (maybeMinus &&  maybeMinus.has(value)) {
      return true;
    }
    /* */
    return false;
  }

}
