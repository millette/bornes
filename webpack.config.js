'use strict'

// core
// const fs = require('fs')

// npm
const webpack = require('webpack')
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')
// const ghIssues = require('rollodeqc-gh-repos-issues')

const plugins = [ new webpack.ProvidePlugin({
  // move drag-drop-polyfill from entry.js?
  'Array.from': 'imports?this=>global!exports?global.Array.from!array.from',
  'Promise': 'imports?this=>global!exports?global.Promise!es6-promise',
  'window.fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
}) ]

/*
const fetchData = (reponame) => new Promise((resolve, reject) => {
  const fn = './' + reponame.replace('/', '--') + '.json'
  try {
    resolve(require(fn))
  } catch (e) {
    ghIssues(reponame)
      .then((data) => fs.writeFile(
        fn, JSON.stringify(data, null, ' '), 'utf-8', (err) => err ? reject(err) : resolve(data)
      ))
      .catch((err) => reject(err))
  }
})
*/

if (process.env.NODE_ENV === 'production') {
  plugins.push(new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }))
} else {
  plugins.push(new BrowserSyncPlugin(
    { host: '0.0.0.0', port: 4030, open: false, proxy: 'http://localhost:4040' },
    { reload: false }
  ))
}

/*
fetchData('millette/committed-streaker')
  .catch((err) => {
    console.log('ERR:', err)
    process.exit(err.statusCode || 500)
  })
*/

module.exports = {
  entry: ['./entry.js'],
  output: { path: __dirname, filename: 'bundle.js' },
  devServer: { inline: true, host: 'localhost', port: 4040 },
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
