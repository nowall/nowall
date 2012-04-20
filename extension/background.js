var encoder = encoderv2({
    baseURL: 'https://ssl.nowall.be'
  , serverAndPort: 'ssl.nowall.be'
  , whiteList: ['github.com', 'plusone.google.com']
});

function executeNoWall(tab, info) {
  var status = getStatus(tab);
  var toUrl;
  if(status == 'on') {
    toUrl = tab.url.replace(/(#|$)/, '&pxraw=true\1');
  } else if(status == 'raw') {
    toUrl = encoder.decodeUrl(tab.url.replace('&pxraw=true', ''));
  } else {
    toUrl = encoder.encodeUrl(tab.url);
  }
  chrome.tabs.update(tab.id, {
      url: toUrl
  })
}

function changeIcon(tabId, status) {
  chrome.browserAction.setIcon({
      tabId: tabId
    , path: 'icons/nowall_' + status + '_16x16.png'
  })
}

// update icon
function updateIcon(tab) {
  changeIcon(tab.id, getStatus(tab));
}

function getStatus(tab) {
  var status = 'off';
  if(tab.url.indexOf('px!=') > 0) {
    status = 'on';
    if(tab.url.indexOf('pxraw=true') > 0) {
      status = 'raw';
    }
  }
  return status;
}

function updateTab(tab) {
  try{
    // chrome.tabs.executeScript(tab.id, {file: "content_script.js"});
  } catch(e) {
    console.log('catch error')
    executeNoWall(tab);
  }
  // chrome.pageAction.show(tab.id);
}

// Called when the user clicks on the browser action icon.
chrome.browserAction.onClicked.addListener(function(tab) {
    if (tab.url.indexOf("http:") != 0 &&
      tab.url.indexOf("https:") != 0) {
      chrome.tabs.update(tab.id, {url: 'https://nowall.be'})
    } else {
      executeNoWall(tab);
    }
});

chrome.tabs.onCreated.addListener(function(tab) {
    updateIcon(tab);
    updateTab(tab);
})

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    updateIcon(tab);
    updateTab(tab);
    if(changeInfo.status == 'complete') {
      // chrome.tabs.executeScript(tabId, {
      //     file: 'content_script.js'
      // })
    }
})

chrome.extension.onConnect.addListener(function(port) {
    var tab = port.sender.tab;

    // This will get called by the content script we execute in
    // the tab as a result of the user pressing the browser action.
    port.onMessage.addListener(function(info) {
        if(info.cmd == 'executeNoWall') {
          executeNoWall(tab, info);
        }
    });
});

