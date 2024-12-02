import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'
import daisyui, { type Theme } from 'daisyui'
import themes from 'daisyui/src/theming/themes'
import { ENV_PROD } from './lib/env'

const config = {
  // 2. Opt for dark mode to be handled via the class method
  darkMode: 'class',
  content: ['./**/*.svelte'],
  theme: {
    extend: {},
  },
  plugins: [typography, daisyui],
  daisyui: {
    themes: [
      {
        dark: {
          ...themes['dark'],
          '--_blur-bg': 'rgba(20, 20, 20, 0.5)',
          '--_blur-bg-soft': 'rgba(200, 200, 200, 0.25)',
          '--_blur-text-color': 'rgb(255, 255, 255)',
          '--options-blended-text-color': '#aaa',
          '--_glassy-gradient-top': '#7771',
          '--_glassy-gradient-bottom': '#7771',
          '--_glassy-inset-shadow-color': '#7776',
        },
      },
      {
        light: {
          ...themes['light'],
          '--_blur-bg': 'rgba(238, 238, 238, 0.5)',
          '--_blur-bg-soft': 'rgba(238, 238, 238, 0.5)',
          '--_blur-text-color': 'rgb(50, 50, 50)',
          '--options-blended-text-color': '#666',
          '--_glassy-gradient-top': '#9996',
          '--_glassy-gradient-bottom': '#fff5',
          '--_glassy-inset-shadow-color': '#fff',
        },
      },
      // 'dark',
      // 'light',
    ],
    darkTheme: 'dark', // name of one of the included themes for dark mode
    base: true, // applies background color and foreground color for root element by default
    styled: true, // include daisyUI colors and design decisions for all components
    utils: !ENV_PROD, // adds responsive and modifier utility classes
    prefix: '', // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
    logs: !ENV_PROD, // Shows info about daisyUI version and used config in the console when building your CSS
    themeRoot: '[data-plasmo-styles-target]', // The element that receives theme color CSS variables
  },
} satisfies Config

export default config
