export function serializeError (error: Error): string {
  return JSON.stringify(error, Object.getOwnPropertyNames(error))
}


export function deserializeError (errorString: string): Error {
  const data = JSON.parse(errorString)
  const error = new Error(data.message)
  Object.assign(error, data)
  return error
}
