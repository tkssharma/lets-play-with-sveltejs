const production = !process.env.ROLLUP_WATCH
const purgecss = require('@fullhuman/postcss-purgecss')

module.exports = {
  plugins: [
    require('postcss-import')(),
    require('precss')(),
    require('tailwindcss'),
    production && require('autoprefixer'),
    production &&
      purgecss({
        content: ['./**/*.html', './**/*.svelte'],
        defaultExtractor: content => content.match(/[A-Za-z0-9-_:/]+/g) || [],
        whitelist: [
          'bg-green-200',
          'bg-orange-900',
          'bg-purple-600',
          'bg-orange-400',
          'bg-pink-300',
          'bg-orange-800',
          'bg-red-600',
          'bg-purple-400',
          'bg-purple-700',
          'bg-green-400',
          'bg-yellow-500',
          'bg-teal-200',
          'bg-orange-300',
          'bg-purple-800',
          'bg-red-500',
          'bg-yellow-700',
          'bg-gray-400',
          'bg-blue-600',
          'bg-pink-600',
          'bg-blue-500',
        ],
      }),
    production && require('cssnano'),
  ],
}
