const path = require('path')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { VanillaExtractPlugin } = require('@vanilla-extract/webpack-plugin')

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
      {
        test: /\.vanilla\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: require.resolve('css-loader'),
            options: {
              url: false,
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.mjs', '.ts', '.tsx'],
  },
  externals: [
    /\@vanilla-extract\/dynamic/,
    /history/,
    /react-fast-compare/,
    /react-transition-group/,
    /react/,
    /react-dom/,
    /react-router-dom/,
  ],
  devtool: 'source-map',
  optimization: {
    minimize: false,
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new VanillaExtractPlugin(),
    new MiniCssExtractPlugin(),
  ],
}
