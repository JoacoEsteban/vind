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

export class UnkownError extends VindError {
  constructor() {
    super("An unknown error occurred", 'UNKNOWN_ERROR')
  }
}

export class RegistrationAbortedError extends VindError {
  constructor() {
    super("Registration aborted by user", 'REGISTRATION_ABORTED')
  }
}

export class UnbindableElementError extends VindError {
  constructor() {
    super("That element/button cannot be bound", 'UNBINDABLE_ELEMENT')
  }
}

export class InexistentElementError extends VindError {
  constructor() {
    super("That element does not exist", 'INEXISTENT_ELEMENT')
  }
}

export class InvalidImportedJSONError extends VindError {
  constructor() {
    super("The imported JSON is invalid", 'INVALID_IMPORTED_JSON')
  }
}

export class ImportedResourceVersionError extends VindError {
  constructor(targetVersion: string, extensionVersion: string) {
    super(`The imported resource comes from a newer version of Vind: ${targetVersion}\nand you have: ${extensionVersion}.\n\nPlease update Vind and try again.`, 'IMPORTED_RESOURCE_VERSION')
  }
}

export class UnexpectedError extends VindError {
  constructor() {
    super("Oops, something went wrong.", 'UNEXPECTED_ERROR')
  }
}

export class NoUniqueXPathExpressionErrorForElement extends VindError {
  constructor() {
    super("That element cannot be bound because it Vind cannot uniquely identify it.", 'NO_UNIQUE_XPATH_EXPRESSION')
  }
}