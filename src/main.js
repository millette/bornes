(function () {
  var ping = function (a) { console.log(new Date(), a) }

  // For discussion and comments, see: http://remysharp.com/2009/01/07/html5-enabling-script/
  var addEvent = (function () {
    if (document.addEventListener) {
      return function (el, type, fn) {
        if (el && el.nodeName || el === window) {
          el.addEventListener(type, fn, false)
        } else if (el && el.length) {
          for (var i = 0; i < el.length; i++) { addEvent(el[i], type, fn) }
        }
      }
    } else {
      return function (el, type, fn) {
        if (el && el.nodeName || el === window) {
          el.attachEvent('on' + type, function () { return fn.call(el, window.event) })
        } else if (el && el.length) {
          for (var i = 0; i < el.length; i++) { addEvent(el[i], type, fn) }
        }
      }
    }
  })()

  var eat = ['yum!', 'gulp', 'burp!', 'nom']
  var yum = document.createElement('p')

  var links = document.querySelectorAll('li > a')
  var bin = document.querySelector('#bin')
  var el
  var i

  var dragStart = function (ev) {
    ping('dragstart')
    ev.dataTransfer.effectAllowed = 'copy' // only dropEffect='copy' will be dropable
    ev.dataTransfer.setData('Text', this.id) // required otherwise doesn't work
  }

  yum.style.opacity = 1
  for (i = 0; i < links.length; ++i) {
    el = links[i]
    el.setAttribute('draggable', 'true')
    addEvent(el, 'dragstart', dragStart)
  }

  addEvent(bin, 'dragover', function (e) {
    ping('dragover')
    if (e.preventDefault) { e.preventDefault() } // allows us to drop
    e.dataTransfer.dropEffect = 'copy'
    return false
  })

  // to get IE to work
  addEvent(bin, 'dragenter', function (e) {
    ping('dragenter')
    this.className = 'over'
    return false
  })

  addEvent(bin, 'dragleave', function () {
    ping('dragleave')
    this.className = ''
  })

  addEvent(bin, 'drop', function (e) {
    ping('drop')
    var el = document.getElementById(e.dataTransfer.getData('Text'))
    var y
    if (e.stopPropagation) { e.stopPropagation() } // stops the browser from redirecting...why???
    el.parentNode.removeChild(el)
    // stupid nom text + fade effect
    bin.className = ''
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
