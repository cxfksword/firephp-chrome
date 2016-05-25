var isPoweredOn = true;

document.addEventListener('DOMContentLoaded', function () {
	chrome.storage.local.get('isPoweredOn', function(result) {
		isPoweredOn = typeof result.isPoweredOn == 'undefined' ? true : result.isPoweredOn;
		if (isPoweredOn)
		{
			chrome.browserAction.setIcon({ path: "assets/images/FirePHP_19.png" });
		}
		else
		{
			chrome.browserAction.setIcon({ path: "assets/images/FirePHP_19_gray.png" });
		}
	});
});

chrome.browserAction.onClicked.addListener(function(tab)
{
	chrome.browserAction.setBadgeText({'text': ''});
	isPoweredOn = !isPoweredOn;
	if (isPoweredOn)
	{
		chrome.browserAction.setIcon({ path: "assets/images/FirePHP_19.png" });
	}
	else
	{
		chrome.browserAction.setIcon({ path: "assets/images/FirePHP_19_gray.png" });
	}

	chrome.storage.local.set({'isPoweredOn': isPoweredOn});
});

chrome.webRequest.onBeforeSendHeaders.addListener(function(details)
{
	if (!isPoweredOn)
	{
		return { requestHeaders: details.requestHeaders };
	}
	details.requestHeaders.push(
	{
		"name": "X-FirePHP",
		"value": "0.4.4"
	});
	details.requestHeaders.push(
	{
		"name": "X-FirePHP-Version",
		"value": "0.4.4"
	});
	details.requestHeaders.push(
	{
		"name": "X-Wf-Max-Combined-Size",
		"value": "262144"
	});
	details.requestHeaders.push(
	{
		"name": "X-FirePHP-Encoding",
		"value": "zlib-deflate"
	});
	return { requestHeaders: details.requestHeaders };
},
{
	urls: ["<all_urls>"],
	types: ["main_frame", "xmlhttprequest"]
},
["blocking", "requestHeaders"]);

