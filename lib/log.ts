const tagLine = (tag: string) => `[${tag}]`.padEnd(7, ' ') + '-'.repeat(40)

function wrap (fn: (...args: any[]) => void, tag: string, color: string = '') {
  const line = tagLine(tag)
  const lineEnd = tagLine('↑')
  const colorPrint = (msg: string) => fn(`%c${msg}`, `color: ${color}; font-weight: bold;`)
  return (...args: any[]) => {
    colorPrint(line)
    fn(...args)
    colorPrint(lineEnd)
  }
}


export const log = {
  error: wrap(console.error, 'ERROR', 'red'),
  info: wrap(console.info, 'INFO', 'cyan'),
  log: wrap(console.log, 'LOG', ''),
  warn: wrap(console.warn, 'WARN', 'orange'),
  success: wrap(console.log, 'SUCCESS', '#0f0'),
}