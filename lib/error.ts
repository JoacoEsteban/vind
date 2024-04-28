export function serializeError (error: Error): string {
  return JSON.stringify(error, Object.getOwnPropertyNames(error))
}


export function deserializeError (errorString: string): Error {
  const data = JSON.parse(errorString)
  const error = new Error(data.message)
  Object.assign(error, data)
  return error
}

export class VindError extends Error {
  constructor(public message: string, public code: string) {
    super(message)
  }
}

export class RegistrationAbortedError extends VindError {
  constructor() {
    super("Registration aborted by user", 'REGISTRATION_ABORTED')
  }
}

export class UnbindableElementError extends VindError {
  constructor() {
    super("That element/button cannot be bound 🥴", 'UNBINDABLE_ELEMENT')
  }
}

export class InexistentElementError extends VindError {
  constructor() {
    super("That element does not exist", 'INEXISTENT_ELEMENT')
  }
}