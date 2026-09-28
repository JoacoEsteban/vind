import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defaultClientConditions } from 'vite'
import { defineConfig } from 'wxt'
import { commitSha } from './tools/vite-plugin-commit-sha'

export default defineConfig({
  outDir: 'build',
  imports: false,
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    sizes: [128, 64, 48, 32, 16],
  },
  manifest: {
    name: 'Vind: Keyboard Shortcuts for Every Website',
    permissions: ['unlimitedStorage'],
    action: {},
    commands: {
      'toggle-overlay': {
        suggested_key: {
          default: 'Alt+V',
        },
        description: 'Toggle the Vind overlay on the current page.',
      },
      'open-options': {
        description: 'Open the Vind options page.',
      },
      'new-binding': {
        suggested_key: {
          default: 'Alt+Shift+V',
        },
        description: 'Create a new keyboard shortcut binding.',
      },
    },
    browser_specific_settings: {
      gecko: {
        id: 'vind@joacoesteban.com',
      },
    },
  },
  zip: {
    artifactTemplate: '{{browser}}-{{manifestVersion}}.zip',
    zipSources: false,
  },
  vite: () => ({
    // Svelte injects component styles at runtime next to the component, which lands them inside the overlay's shadow root.
    plugins: [svelte({ emitCss: false }), commitSha()],
    resolve: {
      // vite-plugin-svelte 3 targets Vite 5 and sets `conditions: ['svelte']`, which on Vite 6 replaces the defaults.
      // Without `browser`, `svelte` resolves to its SSR runtime, where onMount is a no-op.
      conditions: [...defaultClientConditions],
    },
    build: {
      // Content scripts resolve asset URLs against the host page, so fonts ship as data URLs.
      assetsInlineLimit: (file) => /\.woff2?$/.test(file) || undefined,
    },
    // Vite scans every HTML file under the root by default, including stale build output and test fixtures.
    optimizeDeps: {
      entries: ['entrypoints/**/*.html'],
    },
  }),
})
