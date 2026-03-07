export function entries<P extends Record<PropertyKey, unknown>>(
  obj: P,
): {
  [K in keyof P]: [K, P[K]]
}[keyof P][] {
  return Object.entries(obj) as {
    [K in keyof P]: [K, P[K]]
  }[keyof P][]
}
