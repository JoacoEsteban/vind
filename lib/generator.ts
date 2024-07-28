function* combinationsGenerator<T> (arr: T[], size: number): Generator<T[], void, unknown> {
  const maxSize = arr.length
  if (size > maxSize) {
    throw new Error("size cannot be greater than the array length")
  }

  for (const indices of generateIndices(0, 0, size, maxSize)) {
    yield indices.map(i => arr[i])
  }
}

function* generateIndices (start: number, depth: number, size: number, maxSize: number): Generator<number[], void, unknown> {
  if (depth === size) {
    yield []
    return
  }

  for (let i = start; i <= maxSize - size + depth; i++) {
    for (const rest of generateIndices(i + 1, depth + 1, size, maxSize)) {
      yield [i, ...rest]
    }
  }
}

export function* combinationsDescending<T> (arr: T[]): Generator<T[]> {
  for (let i = arr.length; i >= 0; i--) {
    for (const combination of combinationsGenerator(arr, i)) {
      yield combination
    }
  }
}

export function* combinationsAscending<T> (arr: T[]): Generator<T[]> {
  for (let i = 0; i <= arr.length; i++) {
    for (const combination of combinationsGenerator(arr, i)) {
      yield combination
    }
  }
}

export function* pairCombinations<T> (arr: T[]): Generator<[T, T]> {
  for (const combination of combinationsGenerator(arr, 2)) {
    yield combination as [T, T]
  }
}