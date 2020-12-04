const path = require('path')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: {
    index: path.resolve('./src/index.ts'),
    navigator: path.resolve('./src/navigator/index.ts'),
  },
  output: {
    path: path.resolve('./lib'),
    filename: '[name].js',
    libraryTarget: 'commonjs',
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
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: false,
              modules: true,
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
    /classnames/,
    /mobx/,
    /mobx-react-lite/,
    /querystring/,
    /react-transition-group/,
    /react/,
    /react-dom/,
    /react-router-dom/,
  ],
  externalsType: 'commonjs-module',
  devtool: 'source-map',
  plugins: [new ForkTsCheckerWebpackPlugin()],
}
