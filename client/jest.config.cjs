module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '@shared/(.*)$': '<rootDir>/../shared/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleDirectories: ['node_modules', 'src']
};