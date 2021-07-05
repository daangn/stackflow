const path = require('path')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  mode: 'production',
  entry: {
    index: path.resolve('./src/index.ts'),
    navigator: path.resolve('./src/navigator/index.ts'),
  },
  output: {
    path: path.resolve('./lib'),
    filename: '[name].js',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
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
        test: /\.js$/,
        type: 'javascript/auto',
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: false,
              modules: { localIdentName: 'kf-[hash:base64:5]' },
            },
          },
          'sass-loader',
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.mjs', '.ts', '.tsx'],
  },
  externals: [
    /classnames/,
    /history/,
    /querystring/,
    /react-transition-group/,
    /sagen/,
    /zenscroll/,
    /react/,
    /react-dom/,
    /react-router-dom/,
  ],
  devtool: 'source-map',
  optimization: {
    minimize: false,
  },
  plugins: [new ForkTsCheckerWebpackPlugin(), new MiniCssExtractPlugin()],
}
