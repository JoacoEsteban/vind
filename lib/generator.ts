export function* combinations<T> (arr: T[]): Generator<T[]> {
  const n = arr.length
  debugger
  // Generate binary numbers from 0 to 2^n - 1
  for (let i = 0; i < (1 << n); i++) {
    const combination: T[] = []
    for (let j = 0; j < n; j++) {
      // If the j-th bit is set, include the j-th element
      if (i & (1 << j)) {
        combination.push(arr[j])
      }
    }
    yield combination
  }
}

export function* combinationsDescending<T> (arr: T[]): Generator<T[]> {
  const n = arr.length

  // Generate binary numbers from 2^n - 1 down to 0
  for (let i = (1 << n) - 1; i >= 0; i--) {
    const combination: T[] = []
    for (let j = 0; j < n; j++) {
      // If the j-th bit is set, include the j-th element
      if (i & (1 << j)) {
        combination.push(arr[j])
      }
    }
    yield combination
  }
}

export function* pairCombinations<T> (arr: T[]): Generator<[T, T]> {
  const n = arr.length
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      yield [arr[i], arr[j]]
    }
  }
}