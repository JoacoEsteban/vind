import type { Config } from 'tailwindcss'
import themes from 'daisyui/src/theming/themes'
import { ENV_PROD } from './lib/env'
import plugin from 'tailwindcss/plugin'

const config = {
  // 2. Opt for dark mode to be handled via the class method
  darkMode: 'class',
  content: ['!./node_modules/**/*', './**/*.svelte'],
  theme: {
    extend: {
      zoom: {
        5: '.5',
        10: '.10',
        25: '.25',
        50: '.5',
        75: '.75',
        85: '.85',
        90: '.9',
        100: '1',
        110: '1.1',
        125: '1.25',
        150: '1.5',
        175: '1.75',
        200: '2',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui'),
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        { zoom: (value) => ({ zoom: value }) },
        { values: theme('zoom') },
      )
    }),
  ],
  daisyui: {
    themes: [
      {
        dark: {
          ...themes['dark'],
          '--_blur-bg': 'rgba(20, 20, 20, 0.5)',
          '--_blur-bg-soft': 'rgba(20, 20, 20, 0.25)',
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
          '--_blur-bg-soft': 'rgba(238, 238, 238, 0.25)',
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
