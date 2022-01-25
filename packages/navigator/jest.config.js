const config = {
  verbose: true,
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
}

module.exports = config
