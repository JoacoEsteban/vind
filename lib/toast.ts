import toast from 'svelte-french-toast/dist'

export function withToast<T> (msg: string = 'Loading', fn: () => Promise<T>) {
  const loadingToast = toast.loading(msg)

  const prom = fn()
  prom.finally(() => toast.dismiss(loadingToast))

  return prom
}