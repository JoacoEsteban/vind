import { log } from './log'
import { match } from 'ts-pattern'
import { identity } from './misc'

type sanitizationOptions = {
  glob: boolean
}

export function sanitizeUrl (url: URL): URL {
  const sanitized = new URL(url.href)
  sanitized.hash = ''
  sanitized.search = ''
  sanitized.pathname = sanitizePathname(sanitized.pathname)
  return sanitized
}

export function sanitizeHref (url: string): string {
  return sanitizeUrl(new URL(url)).href
}

function sanitizePathname (pathname: string): string {
  if (!pathname.startsWith('/')) {
    pathname = '/' + pathname
  }

  return pathname
    .toLowerCase()
}

export function getCurrentUrl (): URL {
  return new URL(window.location.href)
}

export function getSanitizedCurrentUrl (): URL {
  return sanitizeUrl(getCurrentUrl())
}


export function urlFromParts (domain: string, path: string): URL {
  if (!domain.startsWith('http')) {
    domain = 'https://' + domain
  }

  return new URL(path, domain)
}

export function resource (url: URL): string {
  return url.host + url.pathname
}

export class Domain {
  constructor(public readonly value: string) {
    if (!/https?:\/\//.test(value)) {
      if (!/^[\w\.\-]+/.test(value)) {
        throw new Error('Invalid domain')
      }
      value = 'https://' + value
    }

    this.value = new URL(value).host
    // this.value = value
  }

  withPath (path: Path) {
    return urlFromParts(this.value, path.value)
  }

  is (path: Domain): boolean {
    return this.value === path.value
  }
}

export class Path {
  public readonly regexp: RegExp
  constructor(public readonly value: string) {
    let sanitized = match(value)
      .when(p => p.startsWith('/'), p => p)
      .when(p => /^https?:\/\//.test(p), p => new URL(p).pathname)
      .when(p => /^[\w\-]+\.[\w\-]+/.test(p), p => p.split('/').slice(1).join('/') || '/')
      .otherwise(identity)

    sanitized = match(sanitized)
      .when(p => p.startsWith('/'), p => p.slice(1))
      .otherwise(identity)
    sanitized = match(sanitized)
      .when(p => p.endsWith('/'), p => p.slice(0, -1))
      .otherwise(identity)
    sanitized = sanitized.toLowerCase()

    this.value = sanitized
    this.regexp = wildcardToRegex(this.value)
  }

  withDomain (domain: Domain) {
    return urlFromParts(domain.value, this.value)
  }

  is (path: Path): boolean {
    return this.value === path.value
  }

  includes (path: Path): boolean {
    return this.value.startsWith(path.value)
  }

  eitherIncludes (path: Path): boolean {
    return this.includes(path) || path.includes(this)
  }

  isRoot (): boolean {
    return this.value === ''
  }

  match (path: Path): boolean {
    return this.regexp.test(path.value)
  }

  eitherMatch (path: Path): boolean { // TODO remove?
    return this.match(path) || path.match(this)
  }

  matchStart (path: Path): boolean {
    return path.includes(this) || this.match(path)
  }

  eitherMatchStart (path: Path): boolean {
    return this.matchStart(path) || path.matchStart(this)
  }

  inferPattern (): Path {
    const replaced = this.value.split('/').map(part => {
      return !/^[a-z-_\*]+$/.test(part) ? '*' : part
    })
      .join('/')

    return new Path(replaced)
  }

  static removeTail (path: Path): Path {
    return new Path(path.value.split('/').slice(0, -1).join('/'))
  }

  static removeHead (path: Path | string): Path {
    path = path instanceof Path ? path : new Path(path)
    return new Path(path.value.split('/').slice(1).join('/'))
  }

  static toggleGlob (path: Path, targetIndex: number): Path {
    const parts = path.value.split('/')
    parts[targetIndex] = '*'
    return new Path(parts.join('/'))
  }
}

export function safeUrl (url: string): URL {
  if (!url.startsWith('http')) {
    url = 'https://' + url
  }

  return new URL(url)
}

function wildcardToRegex (wildcard: string): RegExp {
  // Escape special regex characters
  let escapedString = wildcard.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  // Replace the wildcard '*' with a regex pattern to match any sequence of characters except '/'
  let regexString = escapedString.replace(/\*/g, '.*')

  return new RegExp(`^${regexString}$`)
}