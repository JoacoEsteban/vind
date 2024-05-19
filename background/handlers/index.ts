import type { BindingsStorage } from '~background/storage/bindings-storage'
import type { DisabledBindingPathsStorage } from '~background/storage/disabled-paths-storage'
import { getAssertedActiveTabId } from '~background/utils/tab'
import { serializeError } from '~lib/error'
import { log } from '~lib/log'
import { Domain, Path } from '~lib/url'
import { bindingsMessages, disabledPathsMessages, type ErrResponse } from '~messages/storage'

export class StorageHandlers {
  constructor(
    private bindingsStorage: BindingsStorage,
    private disabledBindingPathsStorage: DisabledBindingPathsStorage
  ) {}

  init () {
    this.setupBindings()
    this.setupDisabledPaths()
  }

  private respondError<T> (promise: Promise<T>, respond: (response: ErrResponse) => void) {
    promise
      .then(() => respond({ error: null }))
      .catch((error) => respond({ error: serializeError(error) }))
  }

  setupBindings () {
    const bindingsStorage = this.bindingsStorage
    bindingsMessages.getAllBindings.stream.subscribe(async ([, sender, respond]) => {
      const bindings = await bindingsStorage.getAllBindings()
      respond(bindings)
    })

    bindingsMessages.getBindingsForSite.stream.subscribe(async ([{ domain, path }, sender, respond]) => {
      const bindings = await bindingsStorage.getBindingsForSite(domain, path)
      respond(bindings)
    })

    bindingsMessages.getBindingsForDomain.stream.subscribe(async ([domain, sender, respond]) => {
      const bindings = await bindingsStorage.getBindingsForDomain(domain)
      respond(bindings)
    })

    bindingsMessages.addBinding.stream.subscribe(async ([binding, sender, respond]) => {
      this.respondError(bindingsStorage.addBinding(binding), respond)
    })

    bindingsMessages.updateBinding.stream.subscribe(async ([binding, sender, respond]) => {
      this.respondError(bindingsStorage.updateBinding(binding), respond)
    })

    bindingsMessages.upsertBinding.stream.subscribe(async ([binding, sender, respond]) => {
      this.respondError(bindingsStorage.upsertBinding(binding), respond)
    })

    bindingsMessages.removeBinding.stream.subscribe(async ([id, sender, respond]) => {
      this.respondError(bindingsStorage.removeBinding(id), respond)
    })

    bindingsMessages.moveBindings.stream.subscribe(async ([payload, sender, respond]) => {
      this.respondError(bindingsStorage.moveBindings(new Domain(payload.domain), new Path(payload.from), new Path(payload.to)), respond)
    })

    bindingsStorage.onAdded$.subscribe(async (binding) => {
      log.info('onAdded from background index', binding)
      bindingsMessages.onBindingAdded.ask(binding, {
        tabId: await getAssertedActiveTabId()
      })
    })

    bindingsStorage.onUpdated$.subscribe(async (binding) => {
      log.info('onUpdated from background index', binding)
      bindingsMessages.onBindingUpdated.ask(binding, {
        tabId: await getAssertedActiveTabId()
      })
    })

    bindingsStorage.onDeleted$.subscribe(async (binding) => {
      log.info('onDeleted from background index', binding)
      bindingsMessages.onBindingRemoved.ask(binding, {
        tabId: await getAssertedActiveTabId()
      })
    })
  }

  setupDisabledPaths () {
    const storage = this.disabledBindingPathsStorage

    disabledPathsMessages.getAllDisabledPaths.stream.subscribe(async ([, sender, respond]) => {
      const disabledPaths = await storage.getAllDisabledPaths()
      respond(disabledPaths)
    })

    disabledPathsMessages.queryDisabledPaths.stream.subscribe(async ([{ domain, path }, sender, respond]) => {
      const disabledPaths = await storage.query(new Domain(domain), new Path(path))
      respond(disabledPaths)
    })

    disabledPathsMessages.disablePath.stream.subscribe(async ([{ domain, path }, sender, respond]) => {
      this.respondError(storage.disablePath(new Domain(domain), new Path(path)), respond)
    })

    disabledPathsMessages.enablePath.stream.subscribe(async ([{ domain, path }, sender, respond]) => {
      this.respondError(storage.enablePath(new Domain(domain), new Path(path)), respond)
    })

    disabledPathsMessages.togglePath.stream.subscribe(async ([{ domain, path }, sender, respond]) => {
      this.respondError(storage.togglePath(new Domain(domain), new Path(path)), respond)
    })

    storage.onAdded$.subscribe(async (disabledPath) => {
      log.info('onAdded from background index', disabledPath)
      disabledPathsMessages.onDisabledBindingPathAdded.ask(disabledPath, {
        tabId: await getAssertedActiveTabId()
      })
    })

    storage.onDeleted$.subscribe(async (disabledPath) => {
      log.info('onDeleted from background index', disabledPath)
      disabledPathsMessages.onDisabledBindingPathRemoved.ask(disabledPath, {
        tabId: await getAssertedActiveTabId()
      })
    })
  }
}