module.exports = {
  root: true,
  extends: [
    'airbnb',
  ],
  plugins: [
    'json-format',
    'simple-import-sort',
  ],
  rules: {
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
  },
  ignorePatterns: [
    '**/__generated__/**/*.ts',
    '**/__generated__/**/*.js',
    '**/lib/**/*.ts',
    '**/lib/**/*.js',
  ],
};
