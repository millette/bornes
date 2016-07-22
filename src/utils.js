/* globals $ */
'use strict'

// self
var setupDragDrop = require('./dnd')

// npm
var pagejs = require('page')
$.fn.render = require('transparency').jQueryPlugin

var init = function (mod) {
  var appData = { }

  var ghPatch = function (u, body) {
    var headers
    var requestHeaders = {
      authorization: 'token ' + appData.token,
      'content-type': 'application/json'
    }
    return window.fetch(u, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: requestHeaders
    })
      .then(function (response) {
        var cur
        var er
        var it = response.headers.keys()
        headers = { }
        while ((cur = it.next())) {
          if (cur.done) { break }
          headers[cur.value] = response.headers.get(cur.value)
        }
        if (response.status !== 200) {
          er = new Error('Unable to PATCH: ' + response.status)
          er._headers = headers
          throw er
        }
        return response.json()
      })
      .then(function (j) {
        if (headers) { j._headers = headers }
        return j
      })
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

  var fetchIssues = function (fullName, token, doc) {
    return ghFetch('https://api.github.com/repos/' + fullName + '/issues', token, doc)
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
  }

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
          appData.token = token
          appData.profile = x[0]
          appData.profile.repositories = x[1]
            .filter(function (y) { return y.open_issues_count })
            .map(function (y) { return { repository: y } })
          pagejs.redirect('/user/' + appData.profile.login)
        })

        .catch(function (error) { showError(error) })
    })
  }

  var repoPage = function (path, title, sel, ctx, next) {
    var found = false
    var fullName = [ctx.params.login, ctx.params.repo].join('/')
    if (appData && ctx && ctx.params && ctx.params.login &&
      ctx.params.repo && appData.profile && appData.profile.login &&
      appData.profile.repositories && appData.profile.repositories.length) {
      appData.profile.repositories.forEach(function (repository) {
        if (found) { return }
        if (repository.repository.full_name === fullName) {
          found = true
          // FIXME: memory leak regarding DnD events?
          $(sel + ' div.milestone').remove()
          if (repository.issues) {
            $(sel).render(repository)
            console.log('AD:', appData)
            setupDragDrop(repository.issues, ghPatch, showError)
          } else {
            fetchIssues(fullName, appData.token, repository)
              .then(function (ya) {
                // console.log('DOSTUFF', ya)
                repository.issues = ya
                $(sel).render(repository)
                setupDragDrop(repository.issues, ghPatch, showError)
              })
          }
        }
      })
    }
    if (!found) { showError('Il n\'y a rien ici.') }
  }

  var statePage = function (path, title, sel, ctx, next) {
    $(sel).render({ json: JSON.stringify(appData, null, ' ') })
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
            full_name: { href: function () { return '/user/' + this.full_name } }
          }
        }
      }
    }
    return function (path, title, sel, ctx, next) {
      if (!appData || !appData.profile || !appData.profile.login) { return pagejs.redirect('/') }
      $(sel).render(appData, directives)
    }
  }())

  $(document).foundation()
  hideAll()
  setupHomeForm()
  pagejs.exit(hideAll)
  setupPage('/', 'Accueil', '#home')
  setupPage('/state', 'State', '#statepage', statePage)
  setupPage('/user/:login', 'Utilisateur', '#user', userPage)
  setupPage('/user/:login/:repo', 'Projet', '#repositorypage', repoPage)
  pagejs({ hashbang: !mod.history })
}

module.exports = {
  init: init
}
