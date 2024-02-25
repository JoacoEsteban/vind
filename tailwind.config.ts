import type { Config } from 'tailwindcss'
import typography from "@tailwindcss/typography"
import daisyui, { type Theme } from 'daisyui'
import themes from "daisyui/src/theming/themes"

const config = {
  // 2. Opt for dark mode to be handled via the class method
  darkMode: 'class',
  content: [
    './**/*.svelte',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    typography,
    daisyui,
  ],
  daisyui: {
    themes: [
      // {
      //   dark: {
      //     ...themes["dark"],
      //     background: "#111",
      //     'base-content': "white",
      //   },
      // },
      'dark',
      'light',
    ],
    darkTheme: "dark", // name of one of the included themes for dark mode
    base: true, // applies background color and foreground color for root element by default
    styled: true, // include daisyUI colors and design decisions for all components
    utils: true, // adds responsive and modifier utility classes
    prefix: "", // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
    logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
    themeRoot: "#plasmo-shadow-container", // The element that receives theme color CSS variables
  },
} satisfies Config

export default config

