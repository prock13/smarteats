export default {
  plugins: {
    'postcss-import': {}, // Handle imports first
    'tailwindcss/nesting': 'postcss-nesting', // Use postcss-nesting for Tailwind
    'tailwindcss': {}, // Process Tailwind directives
    'autoprefixer': {}, // Add vendor prefixes
    'cssnano': { // Minify CSS
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
        normalizeWhitespace: true,
        minifyFontValues: true,
        colormin: true
      }],
    },
  },
}