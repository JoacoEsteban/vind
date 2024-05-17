import { interopRuntime } from '~background/utils/runtime'

export function getExtensionVersion () {
  return interopRuntime().getManifest().version
}

export function openGithub () {
  window.open('https://github.com/joacoesteban/vind')
}

export function exportedResourceFilename () {
  const date = new Date()
  const dateFormatted = date.toDateString()
    .replace(' ', '-')
    .replace(' ', '-')
    .replace(' ', '-')

  return `vind-export-${dateFormatted}`
}

export function noop () {}
export function identity<T> (x: T): T { return x }