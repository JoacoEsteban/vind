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