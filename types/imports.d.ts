declare module '*.png' {
  const value: string
  export default value
}

declare module '~/assets/*.png' {
  const value: string
  export default value
}

declare module '~/assets/icon.png' {
  const value: string
  export default value
}

declare module '*.svg' {
  const value: string
  export default value
}

declare module '~/assets/*.svg' {
  const value: string
  export default value
}

declare module '*.css' {
  const value: string
  export default value
}

declare module '*.scss' {
  const value: string
  export default value
}

declare module 'data-text:*' {
  const value: string
  export default value
}

declare module 'raw:*' {
  const value: string
  export default value
}

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
