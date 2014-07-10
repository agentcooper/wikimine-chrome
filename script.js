/*
 * WikiMine content script
 *
 * This one should measure the time spent on page
 *
 * @author Artem Tyurin
 */
(function() {
  'use strict';

  var start = null;

  var hashJump = [];

  var lastOut = null,
      out = [];

  console.log('--- WikiLearn ---');

  document.addEventListener('webkitvisibilitychange', function() {
    if (!start && !document.webkitHidden) {
      start = Date.now();
    }

    if (document.webkitHidden) {
      lastOut = Date.now();
    } else {
      if (lastOut) {
        out.push(Date.now() - lastOut);
        lastOut = null;
      }
    }
  });

  function checkToken() {
    console.log('Token check request');

    chrome.extension.sendMessage({type: 'checkToken'}, function(response) {
      console.log(response);
    });
  }

  chrome.extension.onMessage.addListener(function(request, sender) {
    console.log(request, sender);
  });

  document.addEventListener('DOMContentLoaded', function() {
    checkToken();

    if (!document.webkitHidden) {
      start = +new Date();
    }
  });

  window.addEventListener('hashchange', function() {
    hashJump.push(document.location.hash);
  });

  function save() {
    // never even opened a tab
    if (!start) {
      return;
    }

    var total    = (lastOut || Date.now()) - start;

    var totalOut = out.reduce(function(a, b) { return a + b; }, 0),
        totalIn  = total - totalOut;

    var msg = {
      type     : 'save',

      url      : document.location.href,

      title    : document.getElementById('firstHeading').innerText,

      start    : Number(start),

      total    : total,
      totalIn  : totalIn,
      totalOut : totalOut,

      referrer: document.referrer,

      hashJump : hashJump
    };

    if (!msg.title) {
      return;
    }

    if (totalIn < 1000) {
      return;
    }

    console.log(msg);
    chrome.extension.sendMessage(msg);
  }

  window.onunload = save;
})();
