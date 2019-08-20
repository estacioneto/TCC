const path = require('path')
const webpack = require('webpack')
const WorkerPlugin = require('worker-plugin')

const babelConfig = require('./babel.config.js')

module.exports = {
  entry: [
    require.resolve('core-js/stable'),
    require.resolve('regenerator-runtime/runtime'),
    require.resolve('tachyons'),
    './src/index.tsx',
  ],
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: babelConfig,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: { extensions: ['*', '.ts', '.tsx', '.js', '.jsx'] },
  output: {
    path: path.resolve(__dirname, 'dist/'),
    publicPath: '/dist/',
    filename: 'bundle.js',
  },
  devServer: {
    contentBase: [path.join(__dirname, 'public/')],
    port: 3000,
    publicPath: 'http://localhost:3000/dist/',
    hot: true,
    compress: true,
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new WorkerPlugin(),
  ],
}
