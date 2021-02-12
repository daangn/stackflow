const { override, addBabelPlugin } = require('customize-cra')

module.exports = override(addBabelPlugin('emotion'))
