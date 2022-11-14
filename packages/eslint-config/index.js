module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["airbnb-base", "prettier"],
  plugins: [
    "json-format",
    "simple-import-sort",
    "@typescript-eslint/eslint-plugin",
  ],
  rules: {
    "no-undef": "off",
    "no-unused-vars": "off",
    "no-underscore-dangle": "off",
    "no-nested-ternary": "off",
    "no-shadow": "off",
    "import/prefer-default-export": "off",
    "import/no-unresolved": "off",
    "import/no-extraneous-dependencies": "off",
    "import/extensions": "off",
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
        disallowTypeAnnotations: false,
      },
    ],
  },
  ignorePatterns: ["**/__generated__/**/*", "**/lib/**/*", "**/dist/**/*"],
};
