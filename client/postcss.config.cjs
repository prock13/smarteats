module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {
      config: './tailwind.config.ts'
    },
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production'
      ? {
          cssnano: {
            preset: ['default', {
              discardComments: {
                removeAll: true,
              },
            }],
          },
        }
      : {}),
  },
}
