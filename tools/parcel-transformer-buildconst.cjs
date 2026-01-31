const { Transformer } = require('@parcel/plugin')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'
const VIOLET = '\x1b[35m'

function computeJjChangeId() {
  try {
    return execSync(
      'jj log -r @ --no-graph -T \'change_id.short(8) ++ "@" ++ commit_id.short(8)\'',
    )
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

function collectWatchPaths(projectRoot) {
  const filesToWatch = [
    path.join(projectRoot, '.jj', 'working_copy', 'checkout'),
    path.join(projectRoot, '.git', 'HEAD'),
  ]
  const existingFiles = filesToWatch.filter((filePath) =>
    fs.existsSync(filePath),
  )
  const createGlobs = []

  const jjHeadsDir = path.join(projectRoot, '.jj', 'repo', 'op_heads', 'heads')
  if (fs.existsSync(jjHeadsDir)) {
    for (const name of fs.readdirSync(jjHeadsDir)) {
      existingFiles.push(path.join(jjHeadsDir, name))
    }
    createGlobs.push(path.join(jjHeadsDir, '*'))
  }

  return { existingFiles, createGlobs }
}

function registerWatchInvalidations(target, projectRoot) {
  const { existingFiles, createGlobs } = collectWatchPaths(projectRoot)

  for (const filePath of existingFiles) {
    target.invalidateOnFileChange(filePath)
  }

  for (const glob of createGlobs) {
    target.invalidateOnFileCreate({ glob })
  }
}

function paintFirstThree(value, color) {
  if (!value) return value

  const head = value.slice(0, 3)
  const tail = value.slice(3)
  return `${color}${BOLD}${head}${RESET}${color}${tail}${RESET}`
}

function formatVersionForLog(value) {
  if (value.includes('@')) {
    const [changeId, gitId] = value.split('@', 2)
    return `${paintFirstThree(changeId, VIOLET)}@${paintFirstThree(
      gitId,
      GREEN,
    )}`
  }

  if (value.startsWith('jj:')) {
    const id = value.slice(3)
    return `jj:${paintFirstThree(id, VIOLET)}`
  }

  if (value.startsWith('git:')) {
    const id = value.slice(4)
    return `git:${paintFirstThree(id, GREEN)}`
  }

  return value
}

function logVersion(value) {
  console.log(
    `\n${CYAN}[buildconst]${RESET} version: ${formatVersionForLog(value)}`,
  )
}

module.exports = new Transformer({
  async loadConfig({ config, options }) {
    registerWatchInvalidations(config, options.projectRoot)
  },

  async transform({ asset, options }) {
    registerWatchInvalidations(asset, options.projectRoot)

    const value = computeJjChangeId()
    logVersion(value)

    asset.type = 'js'
    asset.setCode(`module.exports = ${JSON.stringify(value)};\n`)

    return [asset]
  },
})
