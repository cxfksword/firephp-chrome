var startCapture = false;
var openDevtools = false;

var devtoolsConnected = false;
var panelStatusConnected = false;
var recvPanelStatusConnected = false;
var panelStatusPort = null;

document.addEventListener('DOMContentLoaded', function () {
	// check chrome devtools opened or closed
	chrome.runtime.onConnect.addListener(function(port) {
	    if (port.name == "devtools-connected") {
	    	if (!devtoolsConnected) {
	    		devtoolsConnected = true;
		    	openDevtools = true;
		    	toggleCapture();
				port.onDisconnect.addListener(function() {
					openDevtools = false;
					devtoolsConnected = false;
					panelStatusConnected = false;
					panelStatusPort = null;
					toggleCapture();
				});
			}
		}

		if (port.name == 'panel-recv-msg') {
			if (!panelStatusConnected) {
				startCapture = true;

				panelStatusConnected = true;
				panelStatusPort = port;
				toggleCapture();
				panelStatusPort.onDisconnect.addListener(function() {
					openDevtools = false;
					devtoolsConnected = false;
					panelStatusConnected = false;
					toggleCapture();
				});
			}
		}

		if (port.name == 'panel-send-msg') {
			if (!recvPanelStatusConnected) {
				recvPanelStatusConnected = true;
				port.onMessage.addListener(function(msg) {
			   		startCapture = msg.startCapture;
			   		toggleCapture();
				});
			}
		}
	});
});

function toggleCapture() {
	if (!panelStatusPort) {
		return;
	}

	try {
		if (startCapture && openDevtools){
			panelStatusPort.postMessage({'isPoweredOn': true});
		} else {
			panelStatusPort.postMessage({'isPoweredOn': false});
		}
	} catch(e) {
	}
}

chrome.webRequest.onBeforeSendHeaders.addListener(function(details)
{
	if (!startCapture || !openDevtools)
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

