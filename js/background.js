chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('../html/in_round/create.html', { // append console=true to enable console
    'width': 1400,
    'height': 1000
  });
});

chrome.app.runtime.onInstalled.addListener(function() {
  chrome.app.window.create('../html/in_round/create.html?on_install=true', {
    'width': 1400,
    'height': 1000
  });
});
