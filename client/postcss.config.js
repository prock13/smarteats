export default {
  plugins: {
    'tailwindcss': require('tailwindcss'),
    'autoprefixer': require('autoprefixer'),
    'cssnano': process.env.NODE_ENV === 'production' ? {
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
        normalizeWhitespace: false,
        minifyFontValues: false,
        colormin: false,
        calc: false
      }],
    } : false,
  },
}