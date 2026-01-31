const { Reporter } = require('@parcel/plugin')
const { execFileSync } = require('child_process')
const { Subject } = require('rxjs')
const { filter, scan } = require('rxjs/operators')
const { match } = require('ts-pattern')

const RESET = '\x1b[0m'
const CYAN = '\x1b[36m'
const RED = '\x1b[31m'

function log(message, color = RESET) {
  console.log(`${CYAN}[jj-watch]${RESET} ${color}${message}${RESET}`)
}

function runJj() {
  try {
    execFileSync('jj', [], {
      stdio: 'ignore',
    })
  } catch {
    log('`jj` failed (or is not installed). Continuing build.', RED)
    // Ignore failures so the build pipeline is never blocked by jj availability/errors.
  }
}

const events$ = new Subject()

events$
  .pipe(
    scan(
      (state, event) =>
        match(event.type)
          .with('watchStart', () => ({ isWatching: true, shouldRunJj: false }))
          .with('watchEnd', () => ({ isWatching: false, shouldRunJj: false }))
          .with('buildStart', () => ({
            isWatching: state.isWatching,
            shouldRunJj: state.isWatching,
          }))
          .otherwise(() => ({
            isWatching: state.isWatching,
            shouldRunJj: false,
          })),
      { isWatching: false, shouldRunJj: false },
    ),
    filter((state) => state.shouldRunJj),
  )
  .subscribe(() => {
    runJj()
  })

module.exports = new Reporter({
  report({ event }) {
    events$.next(event)
  },
})
