export type CombinationYield<T> = {
  combination: T[]
  size: number
  iteration: number
  firstOfSize: () => boolean
  lastOfSize: () => boolean
  amountOfCombinationsForSize: () => number
}

function* combinationsGenerator<T>(
  arr: T[],
  size: number,
): Generator<T[], void, unknown> {
  const maxSize = arr.length
  if (size > maxSize) {
    throw new Error('size cannot be greater than the array length')
  }

  for (const indices of generateIndices(0, 0, size, maxSize)) {
    yield indices.map((i) => arr[i])
  }
}

function* generateIndices(
  start: number,
  depth: number,
  size: number,
  maxSize: number,
): Generator<number[], void, unknown> {
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

const binomialCoefficient = (n: number, k: number): number => {
  if (k > n) return 0
  if (k === 0 || k === n) return 1

  let result = 1
  for (let i = 1; i <= k; i++) {
    result *= (n - i + 1) / i
  }
  return Math.round(result)
}

export function* combinationsDescending<T>(
  arr: T[],
): Generator<CombinationYield<T>> {
  for (let size = arr.length; size >= 0; size--) {
    let iteration = 0
    for (const combination of combinationsGenerator(arr, size)) {
      yield {
        combination,
        size,
        iteration,
        firstOfSize: () => iteration === 0,
        lastOfSize: () =>
          iteration === binomialCoefficient(arr.length, size) - 1,
        amountOfCombinationsForSize: () =>
          binomialCoefficient(arr.length, size),
      }

      iteration++
    }
  }
}

export function* pairCombinations<T>(arr: T[]): Generator<[T, T]> {
  for (const combination of combinationsGenerator(arr, 2)) {
    yield combination as [T, T]
  }
}

export function* repeat(times: number): Generator<number> {
  for (let i = 0; i < times; i++) {
    yield i
  }
}
