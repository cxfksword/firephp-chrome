var app= new Vue({
	el: '#firephp-chrome',
	data: {
		activeId:null,
		requests:{},

		activeCookies:[],
		activeDatabaseQueries:[],
		activeHeaders:[],
		activeLog:[],
		activeRequest:[],
		activeRoutes:[],
		activeSessionData:[],
		activeTimeline:[],
		activeTimelineLegend:[],
		activeViews:[],

		showIncomingRequests:true,

		toolBarButtons: []
	},
	panelSendPort: null,
	ready: function() {
		$('#tabs').tabs();
		this.resizableColumns("#requests-header");
		this.resizableColumns("#requests");

		this.initChrome();
		this.createToolbar();

		window.addEventListener('resize', this.handleResize);
	},
	beforeDestroy: function () {
		window.removeEventListener('resize', this.handleResize)
	},
	methods: {
	   initChrome: function() {
		   var self = this;
		   var isPoweredOn = true;
		   self.panelSendPort = chrome.runtime.connect({name: "panel-send-msg"});
		   var port = chrome.runtime.connect({name: "panel-recv-msg"});
		   port.onMessage.addListener(function(msg) {
		   		alert(msg.isPoweredOn);
		   		isPoweredOn = msg.isPoweredOn;
			});
			// key('⌘+k, ctrl+l', function() {
			// 	this.$apply(function() {
			// 		this.clear();
			// 	});
			// });

			chrome.devtools.network.onRequestFinished.addListener(function(request)
			{
					if (!isPoweredOn) {
						return;
					}

					var ext = request.request.url.split('.').pop().split(/\#|\?/)[0];
					if (ext == 'js' || ext == 'css' || ext == 'ttf' || ext == 'png' || ext == 'gif' ||  ext == 'bmp') {
						return;
					}
					var headers = request.response.headers;
					var messages = self.processWfHeaders(headers);
					if (messages.length <= 0) {
						return;
					}


					var requestId = self.guid();
					var requestHeaders = {};
					var data = {
						id: requestId,
						uri:request.request.url,
						controller:request.request.url,
						errorsCount:0,
						warningsCount:0,
						method: self.getRequestMethod(request.request),
						responseStatus:'200'
					};
					$.each(request.request.headers, function(i, header) {
						if (header.name.indexOf('X-Wf-') < 0) {
							requestHeaders[header.name] = header.value;
						}
					});
					data.headers = requestHeaders;
					data.cookies = request.request.cookies;
					data.log = messages;
					self.addRequest(requestId, data);
			});
	   },

		processWfHeaders : function(headers) {
			var enableZlib = false;
			$.each(headers, function(i, header) {
				if (header.name == 'X-FirePHP-Encoding' && header.value == 'zlib-deflate') {
					enableZlib = true;
				}
			});

			headers.sort(function(a,b) {
				var arr1 = a.name.split('-');
				var arr2 = b.name.split('-');
				return parseInt(arr1[arr1.length-1]) -parseInt(arr2[arr2.length-1]); }
			);
			var messages = [];
			var currentMessage = "";
			for (var i in headers)
			{
				if (headers.hasOwnProperty(i))
				{
					var wf_header = headers[i].name.match(/^X-Wf-1-(\d+)-1-(\d+)/i);
					if (wf_header)
					{
						var m = headers[i].value.match(/^(\d+)?\|(.*)\|/i);

						currentMessage += m[2];

						if (headers[i].value.charAt(headers[i].value.length - 1) === "\\")
						{
							// this is a partial message (or continuation)
							continue;
						}

						try
						{
							var idx = parseInt(wf_header[2]) - 1;
							if (enableZlib) {
								currentMessage = ZLIB.inflateInit().inflate(atob(currentMessage));
							}
							messages[idx] = jQuery.parseJSON(currentMessage);
						}
						catch (e)
						{
							console.log("could not parse", currentMessage);
						}

						currentMessage = "";
					}
				}
			}
			if (currentMessage.length > 0 )
			{
				throw new Error("Unfinished Wildfire header: " + currentMessage);
			}
			return messages;
		},

		guid : function() {
			function s4() {
				return Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1);
			}
			return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
				s4() + '-' + s4() + s4() + s4();
		},

		createToolbar : function(){
			var self = this;
			this.createToolbasrButton('circle active', 'Stop recording', function()
			{
				if ($(this).find('i.fa').hasClass('active')) {
					$(this).find('i.fa').removeClass('active');
					self.panelSendPort.postMessage({'startCapture': false});
				} else {
					$(this).find('i.fa').addClass('active');
					self.panelSendPort.postMessage({'startCapture': true});
				}
			});
			this.createToolbasrButton('ban', 'Clear', function()
			{
				self.clear();
			});

			$('.toolbar').replaceWith(this.renderToolbar());
		},

		createToolbasrButton: function(icon, name, callback) {
			this.toolBarButtons.push({
				icon: icon,
				name: name,
				callback: callback
			});
		},

		renderToolbar: function() {
			var $html = $('<div class="toolbar"></div>');

			$.each(this.toolBarButtons, function(i, button)
			{
				var $button = $('<a href="#" title="' + button.name + '"><i class="fa fa-' + button.icon + '"></i></a>');

				$button.on('click', button.callback);

				$html.append($button);
			});

			return $html;
		},

		resizableColumns: function(selector) {
			var $element = $(selector);
			var options = { minWidth: 10 };

			if ($element.data('resizable-columns-sync')) {
				var $target = $($element.data('resizable-columns-sync'));

				$element.on('column:resize', function(event, resizable, $leftColumn, $rightColumn, widthLeft, widthRight)
				{
					var leftColumnIndex = resizable.$table.find('.rc-column-resizing').parent().find('td, th').index($leftColumn);

					var $targetFirstRow = $target.find('tr:first');

					$($targetFirstRow.find('td, th').get(leftColumnIndex)).css('width', widthLeft + '%');
					$($targetFirstRow.find('td, th').get(leftColumnIndex + 1)).css('width', widthRight + '%');

					$target.data('resizableColumns').syncHandleWidths();
					$target.data('resizableColumns').saveColumnWidths();
				});
			}

			$element.resizableColumns(options);
		},

		addRequest : function(requestId, data) {
			var self = this;
			data.responseDurationRounded = data.responseDuration ? Math.round(data.responseDuration) : 0;
			data.databaseDurationRounded = data.databaseDuration ? Math.round(data.databaseDuration) : 0;

			data.log = self.processLog(data.log);
			// data.sessionData = self.createKeypairs(data.sessionData);
			// data.timeline = self.processTimeline(data);
			// data.views = self.processViews(data.viewsData);

			// data.errorsCount = self.getErrorsCount(data);
			// data.warningsCount = self.getWarningsCount(data);

			Vue.set(self.requests, requestId, data);

			if (self.showIncomingRequests) {
				self.setActive(requestId);
			}
		},

		clear : function(){
			var self = this;
			self.requests = {};
			self.activeId = null;

			self.activeCookies = [];
			self.activeDatabaseQueries = [];
			self.activeHeaders = [];
			self.activeLog = [];
			self.activeRequest = [];
			self.activeRoutes = [];
			self.activeSessionData = [];
			self.activeTimeline = [];
			self.activeTimelineLegend = [];
			self.activeViews = [];

			self.showIncomingRequests = true;
		},

		setActive : function(requestId) {
			var self = this;
			self.activeId = requestId;

			self.activeLog = self.requests[requestId].log;
			// self.activeRequest = self.requests[requestId];
			// self.activeRoutes = self.requests[requestId].routes;
			// self.activeSessionData = self.requests[requestId].sessionData;
			// self.activeTimeline = self.requests[requestId].timeline;
			// self.activeTimelineLegend = self.generateTimelineLegend();
			// self.activeViews = self.requests[requestId].views;

			var lastRequestId = Object.keys(self.requests)[Object.keys(self.requests).length - 1];

			self.showIncomingRequests = requestId == lastRequestId;

			self.$nextTick(function () {
				// DOM 现在更新了
				$('#tabs').tabs('refresh');
			});
		},

		getClass : function(requestId)
		{
			if (requestId == this.activeId) {
				return 'selected';
			} else {
				return '';
			}
		},

		showDatabaseConnectionColumn : function(){
			var connections = {};

			this.activeDatabaseQueries.forEach(function(query)
			{
				connections[query.connection] = true;
			});

			return Object.keys(connections).length > 1;
		},

		createKeypairs : function(data)
		{
			var keypairs = [];

			if (!(data instanceof Object)) {
				return keypairs;
			}

			$.each(data, function(key, value){
				keypairs.push({name: key, value: value});
			});

			return keypairs;
		},

		generateTimelineLegend : function()
		{
			var items = [];

			var maxWidth = $('.data-grid-details').width() - 230;
			var labelCount = Math.floor(maxWidth / 80);
			var step = this.activeRequest.responseDuration / (maxWidth - 20);

			for (var j = 2; j < labelCount + 1; j++) {
				items.push({
					left: (j * 80 - 35).toString(),
					time: Math.round(j * 80 * step).toString()
				});
			}

			if (maxWidth - ((j - 1) * 80) > 45) {
				items.push({
					left: (maxWidth - 35).toString(),
					time: Math.round(maxWidth * step).toString()
				});
			}

			return items;
		},

		processHeaders : function(data)
		{
			var headers = [];

			if (!(data instanceof Object)) {
				return headers;
			}

			$.each(data, function(key, value){
				headers.push({name: key, value: value});
			});

			return headers;
		},

		processLog : function(data)
		{
			var topGroup = {
					type:'group',
					label: '',
					meta: {},
					messages:[],
				}
			;

			if (!data) {
				return topGroup;
			}

			var groupStack = [];
			var curGroup = topGroup;
			$.each(data, function(key, value) {
				if (!value) {
					return;
				}
				/*
				Message example:
				0: Object
					File: "/Users/admin/Sites/polygon/webug.php"
					Line: "6"
					Type: "LOG"
				1: "TEST"
				*/
				var message = value
				, label = message[0].Label || ''
				, text = message[1]
				, type = message[0].Type
				;
				switch (type)
				{
					// function(tabId, meta, type, message, label)
					case 'GROUP_START':
						var newGroup = {
							type:'group',
							label: label,
							meta: message[0],
							messages:[],
						};
						curGroup.messages.push(newGroup);
						groupStack.push(curGroup);
						curGroup = newGroup;
					break;

					case 'GROUP_END':
						curGroup = groupStack.pop();
					break;

					case 'TABLE':
						curGroup.messages.push({
							type: 'table',
							label: label,
							messages: text,
							meta: message[0]
						});
					break;

					case 'WARN':
						curGroup.messages.push({
							type: 'warn',
							label: label,
							messages: text,
							meta: message[0]
						});
					break;

					case 'ERROR':
						curGroup.messages.push({
							type: 'error',
							label: label,
							messages: text,
							meta: message[0]
						});
					break;

					case 'INFO':
						curGroup.messages.push({
							type: 'info',
							label: label,
							messages: text,
							meta: message[0]
						});
					break;

					case 'DEBUG':
						curGroup.messages.push({
							type: 'debug',
							label: label,
							messages: text,
							meta: message[0]
						});
					break;

					default:
						curGroup.messages.push({
							type: 'log',
							label: label,
							messages: text,
							meta: message[0]
						});
				}

			});

			return topGroup;
		},

		processTimeline : function(data)
		{
			var j = 1;
			var maxWidth = $('.data-grid-details').width() - 230 - 20;

			var timeline = [];

			$.each(data.timelineData, function(i, value){
				value.style = 'style' + j.toString();
				value.left = (value.start - data.time) * 1000 / data.responseDuration * 100;
				value.width = value.duration / data.responseDuration * 100;

				value.durationRounded = Math.round(value.duration);

				if (value.durationRounded === 0) {
					value.durationRounded = '< 1';
				}

				if (i == 'total') {
					timeline.unshift(value);
				} else {
					timeline.push(value);
				}

				if (++j > 3) j = 1;
			});

			return timeline;
		},

		processViews : function(data)
		{
			var views = [];

			if (!(data instanceof Object)) {
				return views;
			}

			$.each(data, function(key, value)
			{
				if (!(value.data instanceof Object)) {
					return;
				}

				views.push({
					'name': value.data.name,
					'data': value.data.data
				});
			});

			return views;
		},

		getErrorsCount : function(data)
		{
			var count = 0;

			$.each(data.log, function(index, record)
			{
				if (record.level == 'error') {
					count++;
				}
			});

			return count;
		},

		getWarningsCount : function(data)
		{
			var count = 0;

			$.each(data.log, function(index, record)
			{
				if (record.level == 'warning') {
					count++;
				}
			});

			return count;
		},

		handleResize: function() {
			this.activeTimelineLegend = this.generateTimelineLegend();
		},

		getRequestMethod : function(request) {
			var method = request.method;
			for (var i=0; i<request.headers.length; i++ ) {
				if (request.headers[i].value == 'XMLHttpRequest') {
					method = 'xhr';
				}
			}

			return method;
		},

		hideDetailPanel: function(e) {
			$(e.target).closest('div.panel-detail').hide();
		}


	}
});
