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
  import toast, { Toaster } from 'svelte-french-toast/dist'
  import { match } from 'ts-pattern'
  import { askForBindingStream } from '~/messages'
  import Filters from '~components/filters.svelte'
  import Popup from '~components/popup.svelte'
  import { registrationStateToastOptions } from '~lib/definitions'
  import { RegistrationAbortedError, VindError } from '~lib/error'
  import { log } from '~lib/log'
  import { themeController } from '~lib/theme-controller'
  import { showOverlayStream } from '~messages/tabs'
  import {
    pageControllerInstance,
    registrationControllerInstance,
  } from './document-client'

  let showingOverlay = false

  function toggleVisibility() {
    log.info('on toggle visibility')
    showingOverlay = !showingOverlay
  }
  function closePopup() {
    showingOverlay = false
  }

  askForBindingStream.subscribe(() => {
    const registration = registrationControllerInstance.register()

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

      const message = match<Error, string>(err)
        .when(
          (err) => err instanceof RegistrationAbortedError,
          () => 'Registration aborted',
        )
        .when(
          (err) => err instanceof VindError,
          (err: VindError) => err.message,
        )
        .otherwise(() => 'Failed to register binding')

      toast.error(message)
    })

    registration.finally(() => toast.dismiss(loadingToast))
  })

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
  <Popup visible={showingOverlay} {pageControllerInstance} close={closePopup} />
  <Filters />
  <Toaster
    containerClassName={'made-tommy font-regular'}
    toastOptions={{ className: 'bg-blur' }} />
</div>
