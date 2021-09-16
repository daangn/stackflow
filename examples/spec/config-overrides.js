const {
  override,
  addBabelPlugin,
  removeModuleScopePlugin,
} = require('customize-cra')

module.exports = override(
  addBabelPlugin('@emotion'),
  addBabelPlugin([
    'babel-plugin-relay',
    {
      artifactDirectory: './src/__relay__',
    },
  ]),
  removeModuleScopePlugin()
)
