/* global Modernizr */
(function () {
  'use strict'

  // npm
  var pagejs = require('page')
  var transparency = require('transparency')
  //var Modernizr = require('./modernizr-history.js')
  var renderAll = transparency.render.bind(null, document.querySelector('html'))
  // var renderAll = require('transparency').render.bind(null, document.querySelector('html'))

  pagejs('/', function (c) {
    renderAll({ title: 'home' })
    console.log('CONTEXT1:', c)
  })

  pagejs('/p2', function (c) {
    renderAll({ title: 'p2' })
    console.log('CONTEXT2:', c)
  })

  pagejs({ hashbang: !Modernizr.history })

/*
  // npm
  var groupBy = require('lodash.groupby')

  var debugPing = false

  var ping = debugPing
    ? function (a) { console.log(new Date(), a) }
    : function () { }

  var utils = require('./utils')

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
*/
}())
