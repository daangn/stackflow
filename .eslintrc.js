module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  extends: ["airbnb", "prettier"],
  plugins: ["json-format", "simple-import-sort"],
  rules: {
    "react/jsx-filename-extension": [
      1,
      { extensions: [".js", ".jsx", ".tsx"] },
    ],
    "import/prefer-default-export": "off",
    "import/no-unresolved": "off",
    "import/no-extraneous-dependencies": "off",
    "import/extensions": "off",
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
  },
  ignorePatterns: ["**/__generated__/**/*", "**/lib/**/*", "**/dist/**/*"],
};
