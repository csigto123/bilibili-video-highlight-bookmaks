chrome.runtime.onInstalled.addListener(function(details) {
	if (details.reason == "install") {
		chrome.storage.sync.set({
			highlight: []
		}, function() {
			if (chrome.runtime.error) {
				console.log("Runtime error");
			}
		});
	}
});

chrome.webRequest.onSendHeaders.addListener(function(data) {
	aid = data.url.slice(data.url.indexOf('&aid=') + 5, data.url.indexOf('&buvid='));
	cid = data.url.slice(data.url.indexOf('cid:') + 4, data.url.indexOf('&aid'))
	chrome.tabs.sendMessage(data.tabId, {
		av: {
			aid: aid,
			cid: cid
		}
	});
}, {
	urls: [
		"*://api.bilibili.com/x/player.so?id=cid:*&aid=*&buvid=*"
	]
})
