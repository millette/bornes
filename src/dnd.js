'use strict'

// npm
var groupBy = require('lodash.groupby')

var debugPing = true

var ping = debugPing
  ? function (a) { console.log(new Date(), a) }
  : function () { }

module.exports = function (issuesData, ghPatch, showError) {
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

  var body = document.querySelector('#allmilestones')
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
    zone.className = 'issues callout primary no-bullet'
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
    div.className = 'milestone column small-6 medium-3 large-2'
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

    // stops the browser from redirecting...why???
    e.preventDefault()
    if (e.stopPropagation) { e.stopPropagation() }

    draggedOver = false
    return ghPatch(u, { milestone: milestoneNumber })
      .then(function (a) {
        // FIXME: we must invalidate appData issues
        // or better yet, change issue milestone
        self.classList.remove('over')
        console.log('AAA:', a)
        self.appendChild(el)
        return false
      })
      .catch(function (err) {
        self.classList.remove('over')
        console.log('ERR:', err)
        showError(err)
        return false
      })
  })
}
