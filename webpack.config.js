'use strict'

const webpack = require('webpack')

const plugins = [ new webpack.ProvidePlugin({
  // move drag-drop-polyfill from entry.js?
  'Array.from': 'imports?this=>global!exports?global.Array.from!array.from',
  'Promise': 'imports?this=>global!exports?global.Promise!es6-promise',
  'window.fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
}) ]

if (process.env.NODE_ENV === 'production') {
  plugins.push(new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }))
}

module.exports = {
  entry: ['./entry.js'],
  output: { path: __dirname, filename: 'bundle.js' },
  devServer: { host: '0.0.0.0', port: 4040 },
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
