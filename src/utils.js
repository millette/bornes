'use strict'

// For discussion and comments, see: http://remysharp.com/2009/01/07/html5-enabling-script/
exports.addEvent = (function () {
  if (document.addEventListener) {
    return function (el, type, fn) {
      if (el && el.nodeName || el === window) {
        el.addEventListener(type, fn, false)
      } else if (el && el.length) {
        Array.from(el).forEach(function (elem) { exports.addEvent(elem, type, fn) })
      }
    }
  } else {
    return function (el, type, fn) {
      if (el && el.nodeName || el === window) {
        el.attachEvent('on' + type, function () { return fn.call(el, window.event) })
      } else if (el && el.length) {
        Array.from(el).forEach(function (elem) { exports.addEvent(elem, type, fn) })
      }
    }
  }
})()
