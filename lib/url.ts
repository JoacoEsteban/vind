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

  const parts = pathname
    .substring(1)
    .split('/')
    .filter(part => /^[a-z0-9-_]+$/.test(part))

  return parts
    .join('/')
}

export function makeDisplayUrl (url: string): string {
  if (!url) return ''
  const sanitized = sanitizeHref(url)
  // remove protocol and www if present
  const display = sanitized.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '')
  return display
}

export function match (pattern: string, url: string): boolean {
  return url.includes(pattern)
}

export function getCurrentUrl (): URL {
  return new URL(window.location.href)
}

export function getSanitizedCurrentSite (): string {
  return sanitizeHref(window.location.href)
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
  constructor(public readonly value: string) {
    const validated = ((value: string) => {
      if (value.startsWith('/')) return value

      if (/^https?:\/\//.test(value)) {
        return new URL(value).pathname
      }

      return '/' + value
    })(value)
    this.value = sanitizePathname(validated)
  }

  withDomain (domain: Domain) {
    return urlFromParts(domain.value, this.value)
  }

  is (path: Path): boolean {
    return this.value === path.value
  }

  includes (path: Path): boolean {
    return this.value.includes(path.value)
  }
}

export function safeUrl (url: string): URL {
  if (!url.startsWith('http')) {
    url = 'https://' + url
  }

  return new URL(url)
}