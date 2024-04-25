import { Err, Ok, type Result } from 'ts-results'

export function wrapResult<T> (expression: () => T): Result<T, Error> {
  try {
    return new Ok(expression())
  } catch (error) {
    return new Err(error instanceof Error ? error : new Error(String(error)))
  }
}