'use strict'

// npm
var pagejs = require('page')
var groupBy = require('lodash.groupby')
var $ = require('jquery')
$.fn.render = require('transparency').jQueryPlugin

var debugPing = true

var ping = debugPing
  ? function (a) { console.log(new Date(), a) }
  : function () { }

var appData

var ghPatch = function (u, token, body) {
  var headers
  var requestHeaders = {
    authorization: 'token ' + token,
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

// FIXME: Use jQuery instead
var addEvent = (function () {
  if (document.addEventListener) {
    return function (el, type, fn) {
      if (el && el.nodeName || el === window) {
        el.addEventListener(type, fn, false)
      } else if (el && el.length) {
        Array.from(el).forEach(function (elem) { addEvent(elem, type, fn) })
      }
    }
  } else {
    return function (el, type, fn) {
      if (el && el.nodeName || el === window) {
        el.attachEvent('on' + type, function () { return fn.call(el, window.event) })
      } else if (el && el.length) {
        Array.from(el).forEach(function (elem) { addEvent(elem, type, fn) })
      }
    }
  }
})()

// FIXME: Use Transparency or jQuery where possible (addEvent, etc.)
var setupDragDrop = function (issuesData) {
  var setDraggables = function () {
    var links = document.querySelectorAll('ul.issues li')

    var dragStart = function (ev) {
      ping('dragstart:' + this.id)
      ev.dataTransfer.effectAllowed = 'copy' // only dropEffect='copy' will be dropable
      ev.dataTransfer.setData('Text', this.id) // required otherwise doesn't work
    }

    var dragEnd = function () { ping('dragend') }

    Array.from(links).forEach(function (elem, i) {
      elem.setAttribute('draggable', 'true')
      addEvent(elem, 'dragstart', dragStart)
      addEvent(elem, 'dragend', dragEnd)
    })
  }

  var body = document.querySelector('#repositorypage')
  var draggedOver = false
  var byMilestone = groupBy(issuesData, function (x) {
    return x.milestone && x.milestone.number || 'none'
  })

  // console.log('byMilestone:', byMilestone)

  Object.keys(byMilestone).forEach(function (milestoneNumber) {
    // console.log('ML:', milestoneNumber)
    var div = document.createElement('div')
    var h2 = document.createElement('h2')
    var zone = document.createElement('ul')
    var hasTitle = byMilestone[milestoneNumber][0].milestone
    zone.className = 'issues'
    h2.innerHTML = hasTitle ? hasTitle.title : 'Sans milestone'
    zone.id = 'milestone-' + milestoneNumber
    byMilestone[milestoneNumber].forEach(function (z) {
      var el = document.createElement('li')
      var txt = 'Issue #' + z.number
      el.id = 'issue-' + z.number
      z.labels.forEach(function (l) {
        txt += ' <small class="label" style="color: white; background: #' + l.color + ';">' + l.name + '</small>'
      })
      txt += '<br>' + z.title
      el.innerHTML = txt
      zone.appendChild(el)
    })
    div.className = 'milestone'
    div.appendChild(h2)
    div.appendChild(zone)
    body.appendChild(div)
  })
  // console.log('parsed json', issuesData)
  setDraggables()
  var bin = document.querySelectorAll('ul.issues')

  addEvent(bin, 'dragover', function (e) {
    if (!draggedOver) {
      // ping('dragover')
      draggedOver = true
    }

    // allows us to drop
    if (e.preventDefault) { e.preventDefault() }
    e.dataTransfer.dropEffect = 'copy'
    return false
  })

  addEvent(bin, 'dragenter', function (e) {
    // ping('dragenter')
    this.classList.add('over')
    return false
  })

  addEvent(bin, 'dragleave', function () {
    // ping('dragleave')
    draggedOver = false
    this.classList.remove('over')
  })

  addEvent(bin, 'drop', function (e) {
    var self = this
    var id = e.dataTransfer.getData('Text')
    var el = document.getElementById(id)
    var issueNumber = parseInt(id.replace(/^issue-/, ''), 10)
    var milestoneNumber = parseInt(self.id.replace(/^milestone-/, ''), 10)
    var fullName = window.location.pathname.replace(/\/user\//, '')
    var u = ['https://api.github.com/repos', fullName, 'issues', issueNumber].join('/')
    ping('drop')
    ping(u)
    // ping(id)
    // ping(el)
    /*
    ping(issueNumber)
    ping(fullName)
    ping(self)
    */

    // stops the browser from redirecting...why???
    e.preventDefault()
    if (e.stopPropagation) { e.stopPropagation() }

    self.classList.remove('over')
    draggedOver = false
    ghPatch(u, appData.token, { milestone: milestoneNumber })
      .then(function (a) {
        console.log('AAA:', a)
        self.appendChild(el)
      })
      .catch(function (err) {
        console.log('ERR:', err)
      })
    return false
  })
}

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
        // console.log('REPOS:', x[1])
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
        $(sel + ' > div.milestone').remove()
        if (repository.issues) {
          $(sel).render(repository)
          setupDragDrop(repository.issues)
        } else {
          fetchIssues(fullName, appData.token, repository)
            .then(function (ya) {
              // console.log('DOSTUFF', ya)
              repository.issues = ya
              $(sel).render(repository)
              setupDragDrop(repository.issues)
            })
        }
      }
    })
  }
  if (!found) { showError('Il n\'y a rien ici.') }
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

var init = function (mod) {
  appData = { }
  hideAll()
  setupHomeForm()
  pagejs.exit(hideAll)
  setupPage('/', 'Accueil', '#home')
  setupPage('/user/:login', 'Utilisateur', '#user', userPage)
  setupPage('/user/:login/:repo', 'Projet', '#repositorypage', repoPage)
  pagejs({ hashbang: !mod.history })
}

module.exports = {
  init: init,
  appData: appData
}
