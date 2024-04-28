import { ENV_PROD, LOGS_ENABLED } from './env'

const tagLine = (tag: string) => `[${tag}]`.padEnd(7, ' ') + '-'.repeat(40)
const noop = () => {}

function wrap (fn: (...args: any[]) => void, tag: string, color: string = '') {
  if (!LOGS_ENABLED) {
    return noop
  }

  const line = tagLine(tag)
  const lineEnd = tagLine('↑')
  const colorPrint = (msg: string) => fn(`%c${msg}`, `color: ${color}; font-weight: bold;`)
  const trace = console.trace.bind(console)

  return (...args: any[]) => {
    colorPrint(line)
    fn(...args)
    // trace()
    colorPrint(lineEnd)
  }
}


export const log = {
  error: wrap(console.error, 'ERROR', 'red'),
  info: wrap(console.info, 'INFO', 'cyan'),
  log: wrap(console.log, 'LOG', ''),
  debug: wrap(console.log, 'DEBUG', 'violet'),
  warn: wrap(console.warn, 'WARN', 'orange'),
  success: wrap(console.log, 'SUCCESS', '#0f0'),
}