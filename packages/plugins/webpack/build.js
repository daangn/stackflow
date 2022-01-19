const path = require('path')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: {
    index: path.resolve('./src/index.ts'),
  },
  output: {
    path: path.resolve('./'),
    filename: '[name].js',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        type: 'javascript/auto',
      },
      {
        test: /\.tsx?$/,
        use: {
          loader: require.resolve('babel-loader'),
          options: {
            cacheDirectory: true,
            babelrc: true,
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.mjs', '.ts', '.tsx'],
  },
  externals: [/react/, /react-dom/],
  optimization: {
    minimize: false,
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
  ],
}
