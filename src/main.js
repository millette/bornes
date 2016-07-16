(function () {
  console.log('Lets go!')

  // For discussion and comments, see: http://remysharp.com/2009/01/07/html5-enabling-script/
  /*@cc_on'abbr article aside audio canvas details figcaption figure footer header hgroup mark menu meter nav output progress section summary time video'.replace(/\w+/g,function(n){document.createElement(n)})@*/
  var addEvent = (function () {
    if (document.addEventListener) {
      return function (el, type, fn) {
        if (el && el.nodeName || el === window) {
          el.addEventListener(type, fn, false)
        } else if (el && el.length) {
          for (var i = 0; i < el.length; i++) {
            addEvent(el[i], type, fn)
          }
        }
      }
    } else {
      return function (el, type, fn) {
        if (el && el.nodeName || el === window) {
          el.attachEvent('on' + type, function () { return fn.call(el, window.event) })
        } else if (el && el.length) {
          for (var i = 0; i < el.length; i++) {
            addEvent(el[i], type, fn)
          }
        }
      }
    }
  })()


  var eat = ['yum!', 'gulp', 'burp!', 'nom']
  var yum = document.createElement('p')
  var msie = /*@cc_on!@*/0
  yum.style.opacity = 1

  var links = document.querySelectorAll('li > a'), el = null
  for (var i = 0; i < links.length; i++) {
    el = links[i]

    el.setAttribute('draggable', 'true')

    addEvent(el, 'dragstart', function (e) {
      e.dataTransfer.effectAllowed = 'copy' // only dropEffect='copy' will be dropable
      e.dataTransfer.setData('Text', this.id) // required otherwise doesn't work
    })
  }

  var bin = document.querySelector('#bin')

  addEvent(bin, 'dragover', function (e) {
    if (e.preventDefault) e.preventDefault() // allows us to drop
    this.className = 'over'
    e.dataTransfer.dropEffect = 'copy'
    return false
  })

  // to get IE to work
  addEvent(bin, 'dragenter', function (e) {
    this.className = 'over'
    return false
  })

  addEvent(bin, 'dragleave', function () {
    this.className = ''
  })

  addEvent(bin, 'drop', function (e) {
    if (e.stopPropagation) e.stopPropagation() // stops the browser from redirecting...why???

    var el = document.getElementById(e.dataTransfer.getData('Text'))

    el.parentNode.removeChild(el)

    // stupid nom text + fade effect
    bin.className = ''
    yum.innerHTML = eat[parseInt(Math.random() * eat.length)]

    var y = yum.cloneNode(true)
    bin.appendChild(y)

    setTimeout(function () {
      var t = setInterval(function () {
        if (y.style.opacity <= 0) {
          if (msie) { // don't bother with the animation
            y.style.display = 'none'
          }
          clearInterval(t)
        } else {
          y.style.opacity -= 0.1
        }
      }, 50)
    }, 250)

    return false
  })
}())
