chrome.devtools.panels.create(
	"FirePHP Console",
	"assets/images/icon-toolbar.png",
	"app.html",
	function(panel) {
		// for check chrome devtools opened or closed
		chrome.runtime.connect({name: "devtools-connected"});

		// console.log("Panel created.");

		// var extensionId = chrome.i18n.getMessage('@@extension_id');
		// console.log("Extension ID: " + extensionId);
	}
);