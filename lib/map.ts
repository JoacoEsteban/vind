export function MapToOrderedTuple<T, K>(
  map: Map<T, K>,
  order: (a: T, b: T) => number,
) {
  return Array.from(map.entries()).sort(([a], [b]) => order(a, b)) as [T, K][]
}

type NonBroadKey<K extends PropertyKey> = (string extends K ? never : unknown) &
  (number extends K ? never : unknown) &
  (symbol extends K ? never : unknown) &
  K

type EnumRecord<E extends string | number | symbol, V> = { [K in E]: V }

export class TotalMap<E extends PropertyKey, V> extends Map<NonBroadKey<E>, V> {
  constructor(rec: EnumRecord<E, V>) {
    super()
    for (const k in rec)
      this.set(k as NonBroadKey<E>, rec[k as keyof typeof rec] as V)
  }

  override get(key: NonBroadKey<E>): V {
    return super.get(key)!
  }

  override delete(key: NonBroadKey<E>): boolean {
    throw new Error('TotalMap does not support deletion')
  }

  map<T>(mapFn: (key: NonBroadKey<E>, value: V) => T): TotalMap<E, T> {
    return new TotalMap(
      Object.fromEntries(
        Array.from(this.entries()).map(([k, v]) => [k, mapFn(k, v)]),
      ) as EnumRecord<E, T>,
    )
  }
}
