const build = require('./build')

module.exports = {
  ...build,
  mode: 'development',
  watch: true,
}
