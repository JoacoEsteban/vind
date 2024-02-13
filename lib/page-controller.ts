import { Binding, getBindings, getBindingsForSite } from '~lib/binding'

export class PageController {
  private bindings: Binding[] = []
  constructor() {
    this.init()
  }

  async updateBindings () {
    this.bindings = await getBindingsForSite(new URL(window.location.href))
  }

  async handleKey (event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement) {
      return
    }

    console.log(event.key)

    const matchingBindings = this.bindings.filter(binding => binding.key === event.key)

    this.triggerBindings(matchingBindings)
  }

  async triggerBindings (bindings: Binding[]): Promise<void[]> {
    return Promise.all(bindings.map(async binding => {
      console.log('triggering binding', binding)
      return this.clickBinding(binding)
    }))
  }

  async click (element: HTMLElement) {
    // TODO do workaround
    await new Promise<void>((resolve) => {
      element.addEventListener('click', function onClick (e) {
        element.removeEventListener('click', onClick)
        if (e.defaultPrevented)
          element.click()

        resolve()
      })
      element.click()
    })
  }

  async clickBinding (binding: Binding) {
    const element = binding.getElement()
    if (element) {
      await this.click(element)
    } else {
      console.log('no element found for binding', binding)
    }
  }

  async init () {
    console.log('All bindings', await getBindings())

    await this.updateBindings()

    const onKeyPress = (e: KeyboardEvent) => this.handleKey(e)

    document.addEventListener('keypress', onKeyPress)
  }
}