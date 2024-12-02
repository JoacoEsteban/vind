type ContextfulIteration<T> = {
  item: T
  index: number
  first: boolean
  last: boolean
  odd: boolean
  even: boolean
}

export function wrapIterable<T>(
  iter: Iterable<T>,
): Iterable<ContextfulIteration<T>> {
  return {
    [Symbol.iterator]: function* () {
      const arr = Array.from(iter)
      for (let i = 0; i < arr.length; i++) {
        const even = i % 2 === 0
        const odd = !even

        yield {
          item: arr[i],
          index: i,
          first: i === 0,
          last: i === arr.length - 1,
          odd,
          even,
        }
      }
    },
  }
}
