import { minimatch } from 'minimatch'

type sanitizationOptions = {
  glob: boolean
}

export function sanitizeUrl (url: URL): URL {
  const sanitized = new URL(url.href)
  sanitized.hash = ''
  sanitized.search = ''
  sanitized.pathname = sanitizePathname(sanitized)
  return sanitized
}

export function sanitizeHref (url: string): string {
  return sanitizeUrl(new URL(url)).href
}

function sanitizePathname (url: URL): string {
  // console.log('sanitizePathname', url.pathname, url)
  const parts = url.pathname
    .substring(1)
    .split('/')
    .slice(0, 1)
    .filter(part => /^[a-z0-9-_]+$/.test(part))

  return parts
    .join('/')
}

export function addGlob (url: string): string {
  return url
    .replace(/\/$/, '')
    .replace('{/**,}', '')
    .concat('{/**,}')
}

export function makeDisplayUrl (url: string): string {
  if (!url) return ''
  const sanitized = sanitizeHref(url)
  // remove protocol and www if present
  const display = sanitized.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '')
  return display
}

export function makeDisplayPattern (pattern: string): string {
  const [url] = pattern.split('{')
  return makeDisplayUrl(url)
}

export function match (pattern: string, url: URL): boolean {
  const sanitized = sanitizeUrl(url).href
  console.log('match', { sanitized, pattern }, minimatch(sanitized, pattern, { partial: true }))
  return minimatch(sanitized, pattern)
}