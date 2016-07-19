/* global Modernizr */
(function () {
  'use strict'

  // npm
  var pagejs = require('page')
  var transparency = require('transparency')
  // var jQuery = require('jquery')
  // var at = require('jquery-autocomplete')

  // self
  var utils = require('./utils')

  // console.log('jq:', jQuery)
  // console.log('jq-at:', at)

  var homeEl = document.querySelector('#home')
  var homeFormEl = document.querySelector('#home form')
  var userFormEl = document.querySelector('#user form')
  // var p2El = document.querySelector('#p2')
  // var p3El = document.querySelector('#p3')
  var userEl = document.querySelector('#user')
  var appEls = document.querySelectorAll('#app > div')

  var makeRenderer = function (sel) {
    if (typeof sel === 'string') { sel = document.querySelector(sel) }
    return transparency.render.bind(null, sel)
  }

  var renderHead = makeRenderer('head')
  var renderBody = makeRenderer('body')
  // var renderP2 = makeRenderer(p2El)
  // var renderP3 = makeRenderer(p3El)
  var renderUser = makeRenderer(userEl)

  var hideAll = function (c, next) {
    Array.from(appEls).forEach(function (elem) { elem.style.display = 'none' })
    if (next) { next() }
  }

  var setFocus = function (id) {
    var g
    if (!id) { return }
    g = document.querySelector('#' + id + ' input[type="text"]')
    if (g) { g.focus() }
  }

  var renderTitle = function (c, title, id) {
    c.title = title
    renderHead({ title: title })
    renderBody({ title: title })
    setFocus(id)
  }

  utils.addEvent(homeFormEl, 'submit', function (ev) {
    var d = new window.FormData(this)
    var username = d.get('username')
    var token
    // var x = {}
    // var k
    ev.preventDefault()
    // for (k of d.keys()) { if (d.get(k)) { x[k] = d.get(k) } }
    // pagejs.redirect('/user/' + x.username)
    if (username) {
      pagejs.redirect('/user/' + username)
    } else {
      token = d.get('token')
      if (token) { pagejs.redirect('/token/' + token) }
    }
  })

  utils.addEvent(userFormEl, 'submit', function (ev) {
    var d = new window.FormData(this)
    var x = {}
    var k

    ev.preventDefault()
    for (k of d.keys()) { if (d.get(k)) { x[k] = d.get(k) } }
    console.log('X:', x)
  })

  hideAll()
  pagejs.exit(hideAll)

  pagejs('/', function (c) {
    homeEl.style.display = 'block'
    renderTitle(c, 'home', 'home')
  })

/*
  pagejs('/p2', function (c) {
    if (!c.state.rnd) {
      c.state.rnd = 'RON-' + Math.floor(100 * Math.random())
      // c.save()
    }
    p2El.style.display = 'block'
    renderP2({ txt: c.state.rnd, json: JSON.stringify(c, null, ' ') })
    renderTitle(c, 'p2')
  })

  pagejs('/p3', function (c) {
    if (!c.state.rnd) {
      c.state.rnd = 'RON-' + Math.floor(100 * Math.random())
      // c.save()
    }
    p3El.style.display = 'block'
    renderP3({ txt: c.state.rnd, json: JSON.stringify(c, null, ' ') })
    renderTitle(c, 'p3')
  })
*/

  pagejs('/token/:token', function (c) {
    userEl.style.display = 'block'
    if (c.state.repos) {
      renderUser({ repos: c.state.repos, json: JSON.stringify(c, null, ' ') })
      renderTitle(c, 'user', 'user')
    } else {
      console.log('CC:', c)
      window.fetch('https://api.github.com/user/repos', {
        headers: { authorization: 'token ' + c.params.token }
      })
        .then(function (response) { return response.json() })
        .then(function (a) {
          c.state.repos = JSON.stringify(a.map(function (x) { return x.full_name }), null, ' ')
          c.save()
          renderUser({ repos: c.state.repos, json: JSON.stringify(c, null, ' ') })
          renderTitle(c, 'user', 'user')
        })
    }
  })

  pagejs('/user/:username', function (c) {
    userEl.style.display = 'block'
    if (c.state.repos) {
      renderUser({ repos: c.state.repos, json: JSON.stringify(c, null, ' ') })
      renderTitle(c, 'user', 'user')
    } else {
      console.log('CC:', c)
      window.fetch('https://api.github.com/users/' + c.params.username + '/repos')
        .then(function (response) { return response.json() })
        .then(function (a) {
          c.state.repos = JSON.stringify(a.map(function (x) { return x.full_name }), null, ' ')
          c.save()
          renderUser({ repos: c.state.repos, json: JSON.stringify(c, null, ' ') })
          renderTitle(c, 'user', 'user')
        })
    }
  })

  pagejs({ hashbang: !Modernizr.history })
}())

/*
  // npm
  var groupBy = require('lodash.groupby')

  var debugPing = false

  var ping = debugPing
    ? function (a) { console.log(new Date(), a) }
    : function () { }

  // window.fetch('millette--committed-streaker.json')
  window.fetch('https://api.github.com/repos/millette/committed-streaker/issues')
    .then(function (response) {
      var k
      // console.log('response.headers:', Object.keys(response.headers.getAll()))
      for (k of response.headers.keys()) {
         console.log(k, response.headers.getAll(k))
      }
      return response.json()
    })
    .then(function (issuesData) {
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
          utils.addEvent(elem, 'dragstart', dragStart)
          utils.addEvent(elem, 'dragend', dragEnd)
        })
      }

      var body = document.querySelector('body')
      var draggedOver = false
      var byMilestone = groupBy(issuesData, function (x) {
        return x.milestone && x.milestone.number || 'none'
      })

      console.log('byMilestone:', byMilestone)

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
        div.appendChild(h2)
        div.appendChild(zone)
        body.appendChild(div)
      })
      console.log('parsed json', issuesData)
      setDraggables()
      var bin = document.querySelectorAll('ul.issues')

      utils.addEvent(bin, 'dragover', function (e) {
        if (!draggedOver) {
          ping('dragover')
          draggedOver = true
        }

        // allows us to drop
        if (e.preventDefault) { e.preventDefault() }
        e.dataTransfer.dropEffect = 'copy'
        return false
      })

      utils.addEvent(bin, 'dragenter', function (e) {
        ping('dragenter')
        this.classList.add('over')
        return false
      })

      utils.addEvent(bin, 'dragleave', function () {
        ping('dragleave')
        draggedOver = false
        this.classList.remove('over')
      })

      utils.addEvent(bin, 'drop', function (e) {
        var el = document.getElementById(e.dataTransfer.getData('Text'))
        ping('drop')
        draggedOver = false
        // stops the browser from redirecting...why???
        e.preventDefault()
        if (e.stopPropagation) { e.stopPropagation() }

        this.appendChild(el)
        this.classList.remove('over')
        return false
      })
    })
    .catch(function (ex) {
      console.log('parsing failed', ex)
    })
}())
*/
