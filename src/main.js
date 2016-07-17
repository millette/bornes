(function () {
  'use strict'
  var debugPing = false

  var ping = debugPing
    ? function (a) { console.log(new Date(), a) }
    : function () { }

  var utils = require('./utils')

  var bin = document.querySelector('#bin')
  var draggedOver = false

  var setDraggables = function () {
    var rnd = Math.floor(Math.random() * 1e6)
    var links = document.querySelectorAll('ul#items li')

    var dragStart = function (ev) {
      ping('dragstart:' + this.id)
      ev.dataTransfer.effectAllowed = 'copy' // only dropEffect='copy' will be dropable
      ev.dataTransfer.setData('Text', this.id) // required otherwise doesn't work
    }

    var dragEnd = function () { ping('dragend') }

    Array.from(links).forEach(function (elem, i) {
      elem.setAttribute('draggable', 'true')
      if (!elem.id) { elem.id = ('dndrnd-' + rnd) + (i + 1) }
      utils.addEvent(elem, 'dragstart', dragStart)
      utils.addEvent(elem, 'dragend', dragEnd)
    })
  }

  // var issuesData

  window.fetch('millette--committed-streaker.json')
    .then(function (response) {
      return response.json()
    }).then(function (issuesData) {
      var ul = document.querySelector('ul#items')
      console.log('parsed json', issuesData)
      issuesData.forEach(function (z) {
        var el = document.createElement('li')
        var txt = 'Issue #' + z.number
        z.labels.forEach(function (l) {
          txt += ' <small class="label" style="color: white; background: #' + l.color + ';">' + l.name + '</small>'
        })
        txt += '<br>' + z.title
        el.innerHTML = txt
        ul.appendChild(el)
      })
      setDraggables()
    }).catch(function (ex) {
      console.log('parsing failed', ex)
    })

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

  // to get IE to work
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
    var y
    var eat = ['yum!', 'gulp', 'burp!', 'nom']
    var el = document.getElementById(e.dataTransfer.getData('Text'))
    var yum = document.createElement('p')
    yum.style.opacity = 1
    ping('drop')
    draggedOver = false

    // stops the browser from redirecting...why???
    e.preventDefault()
    if (e.stopPropagation) { e.stopPropagation() }

    this.appendChild(el)
    // el.parentNode.removeChild(el)
    // stupid yum text + fade effect
    this.classList.remove('over')
    yum.innerHTML = eat[parseInt(Math.random() * eat.length)]
    y = yum.cloneNode(true)
    bin.appendChild(y)
    setTimeout(function () {
      var t = setInterval(function () {
        if (y.style.opacity <= 0) {
          clearInterval(t)
        } else {
          y.style.opacity -= 0.1
        }
      }, 50)
    }, 250)
    return false
  })
}())
