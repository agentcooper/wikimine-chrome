(function() {
  'use strict';

  var DOMAIN = 'http://wikimine.org';

  var link = DOMAIN + '/api/save?';
  var link_dev = 'http://localhost:8080/save?';

  var redirect = 'https://www.facebook.com/connect/login_success.html',
      id  = '205795012893672',
      url = 'https://www.facebook.com/dialog/oauth?client_id=' +
            id + '&response_type=token&display=popup&redirect_uri=' +
            redirect;

  var token   = localStorage.token || null,
      expires = null;

  function serialize(obj) {
    var str = [];
    for(var p in obj) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
    return str.join("&");
  }

  chrome.browserAction.onClicked.addListener(function() {
    chrome.tabs.create({ url: DOMAIN });
  });

  chrome.tabs.onUpdated.addListener(function(tabid, tab) {
    if (tab.url && tab.url.indexOf(redirect) === 0) {
      var params = tab.url.match(
        /access_token=([a-zA-Z0-9]+)&expires_in=([0-9]+)/
      );

      if (params.length === 3) {
        chrome.extension.sendMessage({
          type: 'freshToken',
          token:   params[1],
          expires: params[2]
        });

        chrome.tabs.remove(tabid);
      }
    }
  });

  function getToken() {
    chrome.tabs.create({
      url: url,
      active: false
    });
  }

  chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {

      if (request.type === 'checkToken') {
        console.log('Checking current token');

        if (!localStorage.token) {

          getToken();

        } else {

          var now = +new Date();

          if (now < +expires) {
            console.log('Not expired yet');
          }

          var xhr = new XMLHttpRequest();
          xhr.open(
            'GET',
            'https://graph.facebook.com/me?access_token=' + localStorage.token,
            true
          );
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              var response = JSON.parse(xhr.responseText);

              if (response.id) {
                sendResponse({'token': 'ok'});
              } else {
                getToken();
              }
            }
          }
          xhr.send();
          return true;
        }
      }

      if (request.type === 'freshToken') {
        token = request.token;
        localStorage.token = token;

        expires = new Date();
        expires.setSeconds(expires.getSeconds() + request.expires);

        console.log('Got a fresh token', token);
      }

      if (request.type === 'save') {

        var data = {
          url: request.url,
          token: token,
          total: request.total,
          type: 'save',
          start: request.start,
          totalIn: request.totalIn,
          title: request.title
        };

        console.log('Saving', data);

        (new Image()).src = link + serialize(data);
        (new Image()).src = link_dev + serialize(data);
      }
  });

  console.log('--- WikiLearn background page ---');
})();
