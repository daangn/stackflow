const address = require('address')
const { override, addBabelPlugin, addWebpackPlugin } = require('customize-cra')
const WebpackQRCodePlugin = require('@daangn/webpack-qrcode-plugin')

const IP = address.ip()
const PORT = process.env.PORT || 3000

module.exports = override(
  addBabelPlugin('emotion'),
  addWebpackPlugin(
    new WebpackQRCodePlugin({
      url: `karrot.alpha://minikarrot/router?remote=http://${IP}:${PORT}&scrollable=false`,
    })
  )
)
