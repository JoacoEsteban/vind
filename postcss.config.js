/**
 * @type {import('postcss').ProcessOptions}
 */

const tailwindcss = require('tailwindcss')
const autoprefixer = require('autoprefixer')
const remToPx = require('@thedutchcoder/postcss-rem-to-px')
module.exports = {
  plugins: [
    tailwindcss,
    remToPx,
    autoprefixer,
  ]
}