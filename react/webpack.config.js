const path = require('path')
const webpack = require('webpack')
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
        exclude: /(node_modules|bower_components|workers)/,
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
    proxy: {
      '/service-worker': 'http://localhost:8081/',
      '/cdn': 'http://localhost:8080/',
    },
    contentBase: [path.join(__dirname, 'public/')],
    port: 3000,
    publicPath: 'http://localhost:3000/dist/',
    hot: true,
    compress: true,
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ],
}
