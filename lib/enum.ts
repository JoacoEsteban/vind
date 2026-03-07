export function keysToIdentityEnum<K extends readonly string[]>(
  keys: K,
): {
  [P in K[number]]: P
} {
  const obj: Record<string, string> = {}
  for (const key of keys) {
    obj[key] = key
  }

  return obj as {
    [P in K[number]]: P
  }
}

export function mapKeysToStaticValue<T, K extends readonly string[]>(
  keys: K,
  staticValue: T,
): {
  [P in K[number]]: T
} {
  const obj: Record<string, T> = {}
  for (const key of keys) {
    obj[key] = staticValue
  }

  return obj as {
    [P in K[number]]: T
  }
}
