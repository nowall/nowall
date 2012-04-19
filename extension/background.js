var encoder = encoderv2({
    baseURL: 'https://ssl.nowall.be:3333'
  , serverAndPort: 'ssl.nowall.be:3333'
  , whiteList: ['github.com', 'plusone.google.com']
});

function executeNoWall(tab, info) {
  var toUrl = encoder.encodeUrl(tab.url);
  console.log('update url %s to %s', tab.url, toUrl);
  chrome.tabs.update(tab.id, {
      url: encoder.encodeUrl(tab.url)
  })
}

function changeIcon(tabId, status) {
  chrome.browserAction.setIcon({
      tabId: tabId
    , path: 'nowall_' + status + '_16x16.png'
  })
}

// update icon
function updateIcon(tab) {
  var status = 'off';
  if(tab.url.indexOf('px!=') > 0) {
    status = 'on';
  }
  changeIcon(tab.id, status);
}

function updateTab(tab) {
  try{
    chrome.tabs.executeScript(tab.id, {file: "content_script.js"});
  } catch(e) {
    console.log('catch error')
    executeNoWall(tab);
  }
}

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

// Called when the user clicks on the browser action icon.
chrome.browserAction.onClicked.addListener(function(tab) {

    if (tab.url.indexOf("http:") != 0 &&
      tab.url.indexOf("https:") != 0) {
      console.log(tab.url);
      chrome.tabs.update(tab.id, {url: 'https://nowall.be'})
    } else {
      executeNoWall(tab);
    }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    updateIcon(tab);
    if(changeInfo.status == 'complete') {
      updateTab(tab);
    }
})

chrome.tabs.onCreated.addListener(function(tab) {
    updateIcon(tab);
    updateTab(tab);
})
