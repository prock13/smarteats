export default {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    'cssnano': {
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
        normalizeWhitespace: false,
        minifyFontValues: false,
        colormin: false,
        calc: false
      }],
    },
  },
}