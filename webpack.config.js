var path = require('path')
var webpack = require('webpack')

module.exports = {
  entry: ['./entry.js'],
  output: {
    path: __dirname,
    filename: 'bundle.js'
  },
  devServer: {
    host: '0.0.0.0',
    port: 4040
  },
  module: {
    loaders: [
      {
        test: /\.css?$/,
        loader: 'style!css'
      },
    ]
  }
}

