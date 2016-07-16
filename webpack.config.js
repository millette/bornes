var path = require('path')
var webpack = require('webpack')

module.exports = {
  entry: ['./entry.js'],
  output: {
    path: path.resolve('build'),
    filename: '[name].js',
    publicPath: '/'
  },
  devServer: {
    port: 4040
  },
  module: {
    loaders: [
      {
        test: /\.css?$/,
        loader: 'style!css'
      }
    ]
  }
}

