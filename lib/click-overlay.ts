export class ClickOverlay {
  readonly overlay: HTMLDivElement
  private mounted = false

  constructor(readonly debug = false) {
    this.overlay = document.createElement('div')
    this.overlay.classList.add('vind-overlay')
    this.overlay.classList.add('vind-ignore-*')
  }

  mount() {
    if (!this.mounted) {
      document.body.appendChild(this.overlay)
      this.mounted = true
    }
    return this
  }

  unmount() {
    if (this.mounted) {
      document.body.removeChild(this.overlay)
      this.mounted = false
    }
    return this
  }

  updateTarget(target: HTMLElement) {
    const { overlay } = this

    const boundingRect = target.getBoundingClientRect()

    overlay.style.position = 'fixed'
    overlay.style.top = `${boundingRect.top}px`
    overlay.style.left = `${boundingRect.left}px`
    overlay.style.width = `${boundingRect.width}px`
    overlay.style.height = `${boundingRect.height}px`

    if (this.debug) {
      overlay.style.backgroundColor = 'red'
    }

    overlay.style.zIndex = '999999999'
    overlay.style.borderRadius = getComputedStyle(target).borderRadius

    return this
  }
}
