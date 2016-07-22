'use strict'

// core
var path = require('path')

// npm
const webpack = require('webpack')
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')

const plugins = [ new webpack.ProvidePlugin({
  // move drag-drop-polyfill from entry.js?
  'Promise': 'imports?this=>global!exports?global.Promise!es6-promise',
  'window.fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
}) ]

if (process.env.NODE_ENV === 'production') {
  plugins.push(new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }))
} else {
  plugins.push(new BrowserSyncPlugin(
    { host: '0.0.0.0', port: 4030, open: false, proxy: 'http://localhost:4040' },
    { reload: false }
  ))
}

module.exports = {
  entry: ['./entry.js'],
  output: {
    path: path.resolve(__dirname, 'build/assets'),
    publicPath: '/assets/',
    filename: 'bundle.js'
  },
  devServer: {
    inline: true,
    hot: true,
    historyApiFallback: true,
    host: 'localhost',
    port: 4040
  },
  module: {
    loaders: [
      { test: /\.css?$/, loader: 'style!css' },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: [
          'file?hash=sha512&digest=hex&name=[hash].[ext]',
          'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
        ]
      }
    ]
  },
  plugins: plugins
}
