module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {
      config: './tailwind.config.ts'
    },
    autoprefixer: {},
    cssnano: process.env.NODE_ENV === 'production' ? {
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