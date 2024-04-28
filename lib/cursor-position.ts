import { fromEvent, share, throttleTime } from 'rxjs'

export const mouse$ = fromEvent<MouseEvent>(document, 'mousemove')
  .pipe(
    throttleTime(20),
    share()
  )

export function cursorPosition (node: HTMLElement, percentage = true) {
  // get cursor position and set it to the node

  const sub = mouse$.subscribe(e => {
    const X = e.clientX
    const Y = e.clientY

    if (percentage) {
      let x = (X / window.innerWidth * 100)
      let y = (Y / window.innerHeight * 100)

      const ratiox = (x / 50) - 1
      const ratioy = (y / 50) - 1

      x = x - (50 * .95 * ratiox)
      y = y - (50 * .95 * ratioy)

      node.style.setProperty('--mouse-x', x + '%')
      node.style.setProperty('--mouse-y', y + '%')
    } else {
      node.style.setProperty('--mouse-x', X + 'px')
      node.style.setProperty('--mouse-y', Y + 'px')
    }
  })

  return {
    destroy: () => {
      // remove the event listener
      sub.unsubscribe()
    }
  }
}