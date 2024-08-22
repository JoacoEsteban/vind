<script context="module" lang="ts">
  import '~lib/fonts-importer'
  import styleText from 'data-text:~/style.sass'
  import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo'

  export const config: PlasmoCSConfig = {
    matches: ['<all_urls>'],
  }

  export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement('style')
    style.textContent = styleText
    return style
  }
</script>

<script lang="ts">
  import { pairwise, startWith, Subject } from 'rxjs'
  import toast from 'svelte-french-toast/dist'
  import { match } from 'ts-pattern'
  import Filters from '~components/filters.svelte'
  import Popup from '~components/popup.svelte'
  import Toaster from '~components/toaster.svelte'
  import { registrationStateToastOptions } from '~lib/definitions'
  import {
    RegistrationAbortedError,
    UnexpectedError,
    VindError,
  } from '~lib/error'
  import { log } from '~lib/log'
  import { themeController } from '~lib/theme-controller'
  import type { Path } from '~lib/url'
  import { newBinding } from '~messages/index'
  import { showOverlayStream } from '~messages/tabs'
  import {
    pageControllerInstance,
    registrationControllerInstance,
  } from './document-client'

  let showingOverlay = false
  const registering$ = registrationControllerInstance.registrationInProgress$

  function toggleVisibility() {
    log.info('on toggle visibility')
    showingOverlay = !showingOverlay
  }
  function closePopup() {
    showingOverlay = false
  }

  function registerNewBinding(path?: Path) {
    const site = pageControllerInstance.currentSiteSplitted()

    if (!site) {
      toast.error(new UnexpectedError().message)
      return
    }

    const { domain } = site
    path = path || site.path.inferPattern()

    const registration = registrationControllerInstance.register(domain, path)

    const loadingToast = toast.loading(
      'Registering Binding. Press ESC to cancel.',
      { position: 'top-right' },
    )

    registration.then(() => {
      log.success('registering done')
      toast.success('Binding registered')
    })

    registration.catch((err) => {
      log.error('registering failed', err)

      const [message, duration] = match<Error, [string, number]>(err)
        .when(
          (err) => err instanceof RegistrationAbortedError,
          () => ['Registration aborted', 1000],
        )
        .when(
          (err) => err instanceof VindError,
          (err: VindError) => [err.message, 3000],
        )
        .otherwise(() => ['Failed to register binding', 3000])

      toast.error(message, {
        duration,
      })
    })

    registration.finally(() => toast.dismiss(loadingToast))
  }

  newBinding.stream.subscribe(() => registerNewBinding())

  const registrationStateToastSubject = new Subject<string | null>()
  registrationStateToastSubject
    .pipe(startWith(''), pairwise())
    .subscribe(([oldToast]) => {
      oldToast && toast.dismiss(oldToast)
    })

  registrationControllerInstance.registrationState$.subscribe((state) => {
    const message = registrationStateToastOptions[state]
    const toastId =
      message &&
      toast(message.text, {
        duration: Infinity,
        icon: message.icon,
      })

    registrationStateToastSubject.next(toastId)
  })

  showOverlayStream.subscribe(toggleVisibility)
</script>

<div use:themeController>
  <Popup
    visible={showingOverlay}
    disabled={$registering$}
    {pageControllerInstance}
    close={closePopup}
    on:registerNewBinding={(e) => registerNewBinding(e.detail.path)} />
  <Filters />
  <Toaster />
</div>
