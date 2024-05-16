import semver from 'semver'
import { interopRuntime } from '~background/utils/runtime'

export function getExtensionVersion () {
  return interopRuntime().getManifest().version
}

export function areSameMajor (a: string, b: string) {
  return semver.major(a) === semver.major(b)
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