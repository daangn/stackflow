const {
  override,
  addBabelPlugin,
  removeModuleScopePlugin,
} = require('customize-cra')

module.exports = override(addBabelPlugin('@emotion'), removeModuleScopePlugin())
