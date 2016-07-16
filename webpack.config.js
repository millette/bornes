'use strict'

// const webpack = require('webpack')

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
  }
}
