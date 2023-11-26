export function sanitizeUrl (url: URL): URL {
  const sanitized = new URL(url.href)
  sanitized.hash = ''
  sanitized.search = ''
  sanitized.pathname = sanitizePathname(sanitized)
  console.log('sanitized', sanitized)
  return sanitized
}

function sanitizePathname (url: URL): string {
  const parts = url.pathname.split('/')
  return parts.filter(part => /^[a-zA-Z0-9-_]+$/.test(part)).concat('*').join('/')
}