(function () {
  'use strict'
  var debugPing = false

  var ping = debugPing
    ? function (a) { console.log(new Date(), a) }
    : function () { }

  // For discussion and comments, see: http://remysharp.com/2009/01/07/html5-enabling-script/
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

  var bin = document.querySelector('#bin')
  var draggedOver = false

  var setDraggables = function () {
    var rnd = Math.floor(Math.random() * 1e6)
    var links = document.querySelectorAll('li')

    var dragStart = function (ev) {
      ping('dragstart:' + this.id)
      ev.dataTransfer.effectAllowed = 'copy' // only dropEffect='copy' will be dropable
      ev.dataTransfer.setData('Text', this.id) // required otherwise doesn't work
    }

    var dragEnd = function () { ping('dragend') }

    Array.from(links).forEach(function (elem, i) {
      elem.setAttribute('draggable', 'true')
      if (!elem.id) { elem.id = ('dndrnd-' + rnd) + (i + 1) }
      addEvent(elem, 'dragstart', dragStart)
      addEvent(elem, 'dragend', dragEnd)
    })
  }

  setDraggables()

  addEvent(bin, 'dragover', function (e) {
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
  addEvent(bin, 'dragenter', function (e) {
    ping('dragenter')
    this.classList.add('over')
    return false
  })

  addEvent(bin, 'dragleave', function () {
    ping('dragleave')
    draggedOver = false
    this.classList.remove('over')
  })

  addEvent(bin, 'drop', function (e) {
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

    el.parentNode.removeChild(el)
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
