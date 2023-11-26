import { Binding, getBindings, getBindingsForSite } from '~lib/binding'


function handleKey (event: KeyboardEvent, bindings: Binding[]) {
  if (event.target instanceof HTMLInputElement) {
    return
  }

  console.log(event.key)

  const matchingBindings = bindings.filter(binding => binding.key === event.key)

  triggerBindings(matchingBindings)
}

async function triggerBindings (bindings: Binding[]) {
  bindings.map(async binding => {
    console.log('triggering binding', binding)
    const element = binding.getElement()
    console.log('element', element)
    if (element) {
      await click(element)
    } else {
      console.log('no element found for binding', binding)
    }
  })
}

async function click (element: HTMLElement) {
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


async function init () {
  console.log('All bindings', await getBindings())

  let bindings: Binding[] = []
  async function updateBindings () {
    bindings = await getBindingsForSite(new URL(window.location.href))
    console.log('bindings', bindings)
  }

  await updateBindings()

  if (!bindings.length) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    const element = document.querySelector('#q2sIQ')
    if (!element)
      throw new Error('no element found')

    const testBinding = Binding.fromElement(element as HTMLElement, 's')
    await testBinding.save()
    await updateBindings()
  }

  const onKeyPress = (e: KeyboardEvent) => handleKey(e, bindings)

  document.addEventListener('keypress', onKeyPress)
}


init()