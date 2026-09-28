declare global {
  interface Window {
    navigation?: {
      addEventListener: (
        type: string,
        listener: (...args: unknown[]) => void,
        options?: boolean | AddEventListenerOptions,
      ) => void
    }
  }

  namespace svelte.JSX {
    interface HTMLAttributes<T> {
      type?: string
    }
  }

  namespace svelteHTML {
    interface HTMLAttributes<T> {
      type?: string
    }
  }
}

export {}
