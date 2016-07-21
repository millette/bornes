'use strict'

// npm
var pagejs = require('page')
var $ = require('jquery')
$.fn.render = require('transparency').jQueryPlugin

var appData

var hideAll = (function () {
  var $divs = $('#app > div')
  return function (c, next) {
    $divs.hide()
    if (next) { next() }
  }
}())

var setupPage = (function () {
  var $head = $('head')
  var $body = $('body')
  return function (path, title, sel, more) {
    pagejs(path, function (ctx, next) {
      var $sel = $(sel)
      ctx.title = title
      $head.render({ title: title })
      $body.render({ title: title })
      if (typeof more === 'function') { more(path, title, sel, ctx, next) }
      $sel.show()
      $(sel + ' input[type="text"]').focus()
    })
  }
}())

var ghFetch = function (u, token, doc) {
  var headers
  var requestHeaders = { authorization: 'token ' + token }
  if (doc && doc._headers && doc._headers.etag) { requestHeaders['if-none-match'] = doc._headers.etag }
  return window.fetch(u, { headers: requestHeaders })
    .then(function (response) {
      var cur
      var it = response.headers.keys()
      if (response.status === 304) { return doc }
      headers = { }
      while ((cur = it.next())) {
        if (cur.done) { break }
        headers[cur.value] = response.headers.get(cur.value)
      }

      return response.json()
    })
    .then(function (j) {
      if (j._headers) { return j }
      if (headers) { j._headers = headers }
      return j
    })
}

var fetchUser = function (token, doc) {
  return ghFetch('https://api.github.com/user', token, doc)
    .then(function (j) {
      var error
      if (j && j.login) { return j }
      error = new Error(j.message)
      error._headers = j._headers
      throw error
    })
}

var fetchRepositories = function (token, doc) {
  return ghFetch('https://api.github.com/user/repos', token, doc)
/*
    .then(function (j) {
      var error
      if (j && j.login) { return j }
      error = new Error(j.message)
      error._headers = j._headers
      throw error
    })
*/
}

var showError = (function () {
  var $app = $('#app')
  var $error = $('#error')
  return function (error) {
    var errorStr
    $error.show()
    if (typeof error === 'string') { return $app.render({ error: error }) }
    errorStr = error.toString()
    if (error._headers['x-ratelimit-remaining']) {
      errorStr += ' - Il vous reste ' + error._headers['x-ratelimit-remaining'] + ' tentatives jusqu\'à '
      errorStr += new Date(1000 * parseInt(error._headers['x-ratelimit-reset'], 10))
    }
    $app.render({ error: errorStr })
  }
}())

var setupHomeForm = function () {
  var $homeForm = $('#home form')
  $homeForm.submit(function (ev) {
    var d = new window.FormData($homeForm[0])
    var token = d.get('token')
    ev.preventDefault()
    if (!token) { return showError('Token github requis.') }

    Promise.all([
      fetchUser(token, appData && token === appData.token ? appData.profile : false),
      fetchRepositories(token, appData && token === appData.token ? appData.profile.repositories : false)
    ])
      .then(function (x) {
        console.log('REPOS:', x[1])
        appData.token = token
        appData.profile = x[0]
        appData.profile.repositories = x[1]
          .filter(function (y) {
            return y.open_issues_count
          })
          .map(function (y) {
            return { repository: y }
          })
        pagejs.redirect('/user/' + appData.profile.login)
      })

      .catch(function (error) { showError(error) })
  })
}

var repoPage = function () {
  if (!appData || !appData.profile || !appData.profile.login) { return pagejs.redirect('/') }
}

var userPage = (function () {
  var directives = {
    profile: {
      avatar_url: {
        alt: function () { return 'Avatar de ' + this.login },
        src: function () { return this.avatar_url + '&s=80' }
      },
      repositories: {
        repository: {
          full_name: {
            href: function () { return '/user/' + this.full_name }
          }
        }
      }
    }
  }
  return function (path, title, sel, ctx, next) {
    if (!appData || !appData.profile || !appData.profile.login) { return pagejs.redirect('/') }
    $('#user').render(appData, directives)
  }
}())

var init = function (mod) {
  appData = { }
  hideAll()
  setupHomeForm()
  pagejs.exit(hideAll)
  setupPage('/', 'Accueil', '#home')
  setupPage('/user/:login', 'Utilisateur', '#user', userPage)
  setupPage('/user/:login/:repo', 'Projet', '#projet', repoPage)
  pagejs({ hashbang: !mod.history })
}

module.exports = {
  init: init,
  appData: appData
}
