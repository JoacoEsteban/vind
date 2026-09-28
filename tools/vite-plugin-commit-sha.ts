import { execFileSync } from 'node:child_process'
import { match, P } from 'ts-pattern'
import type { Plugin } from 'vite'
import { wrapResult } from '../lib/control-flow'

const moduleId = 'virtual:commit-sha'
const resolvedModuleId = `\0${moduleId}`

const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'
const VIOLET = '\x1b[35m'

// Any jj command snapshots the working copy first, so the ids reflect the files being built.
const computeJjChangeId = () =>
  wrapResult(() =>
    execFileSync('jj', [
      'log',
      '-r',
      '@',
      '--no-graph',
      '-T',
      'change_id.short(8) ++ "@" ++ commit_id.short(8)',
    ])
      .toString()
      .trim(),
  ).unwrapOr('unknown')

const paintFirstThree = (value: string, color: string) =>
  `${color}${BOLD}${value.slice(0, 3)}${RESET}${color}${value.slice(3)}${RESET}`

const formatVersionForLog = (value: string) =>
  match(value.split('@'))
    .with(
      [P.string, P.string],
      ([changeId, commitId]) =>
        `${paintFirstThree(changeId, VIOLET)}@${paintFirstThree(commitId, GREEN)}`,
    )
    .otherwise(() => value)

export const commitSha = (): Plugin => ({
  name: 'vind:commit-sha',
  resolveId: (id) =>
    match(id)
      .with(moduleId, () => resolvedModuleId)
      .otherwise(() => null),
  load: (id) =>
    match(id)
      .with(resolvedModuleId, () => {
        const value = computeJjChangeId()
        console.log(
          `\n${CYAN}[commit-sha]${RESET} version: ${formatVersionForLog(value)}`,
        )
        return `export default ${JSON.stringify(value)}`
      })
      .otherwise(() => null),
})
