export function MapToOrderedTuple<T, K> (map: Map<T, K>, order: (a: T, b: T) => number) {
  return Array.from(map.entries()).sort(([a], [b]) => order(a, b)) as [T, K][]
}