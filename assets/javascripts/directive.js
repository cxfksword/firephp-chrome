
Vue.directive('prettyLog', function (msg) {
	getPrettyLog($(this.el), msg, 0);
	bindClipboard();
});

Vue.directive('prettyFile', function (meta) {

	var file = meta.File;
	var pathArr = file.split('/');
	if (pathArr.length > 1) {
		file = pathArr[pathArr.length -1];
	} else {
		pathArr = file.split('\\');
		if (pathArr.length > 1) {
			file = pathArr[pathArr.length -1];
		}
	}
	var line = meta.Line;

	$(this.el).html(file + ":" + line);
});

Vue.directive('scrollToNew', function (data) {
	if (scope.showIncomingRequests && scope.$last) {
		var $container = $(element).parents('.data-container').first();
		var $parent = $(element).parent();

		$container.scrollTop($parent.height());
	}
});


function getPrettyLog($element, msg, nestLevel) {
		var data = '';
		var label = '';
		var labelColor = '';
		var labelClass = '';

		if (msg.type == 'info') {
			$element.addClass('console-info-level');
		} else if (msg.type == 'warn') {
			$element.addClass('console-warning-level');
		} else if (msg.type == 'error') {
			$element.addClass('console-error-level');
		}  else if (msg.type == 'table') {
			$element.addClass('console-table-level');
			msg.label = msg.messages[0];
		}   else if (msg.type == 'group') {
			$element.addClass('console-group-level');
			if (msg.meta.Color) {
				labelColor = 'style="color:' + msg.meta.Color + '"';
			}
			labelClass = 'console-group-title';
		}  else if (msg.type == 'exception' || (msg.type == 'log' && msg.messages.Type && msg.messages.Type == 'throw')) {
			$element.addClass('console-exception-level');
			msg.label = '<i class="pretty-jason-icon-closed"></i> ' + msg.messages.Class + ': ' + msg.messages.Message;
			msg.type = 'exception';
		}  else if (msg.type == 'trace' || (msg.type == 'log' && msg.messages.Type && msg.messages.Type == '->')) {
			$element.addClass('console-trace-level');
			msg.label = '<i class="pretty-jason-icon-closed"></i> ' + msg.messages.Message;
			msg.type = 'trace';
		} else {
			$element.addClass('console-log-level');
		}

		if (msg.label && typeof msg.label ==  'string' && msg.label != '') {
			label = '<span class="console-label '+labelClass+'" '+ labelColor +'>' +msg.label + ':</span> ';
		}

		if (msg.type == 'table') {
			data = getPrettyTable(msg);
		} else if (msg.type == 'group') {
			data = getPrettyGroup(msg, nestLevel);
		} else if (msg.type == 'exception') {
			data = getPrettyException(msg);
		} else if (msg.type == 'trace') {
			data = getPrettyTrace(msg);
		} else {
			data = getPrettyMsg(msg);
		}

		var $el = $('<div class="console-message"></div>');

		$el.append(label);
		$el.append(data);

		$element.find('.log-message').html($el);

		if ($element.find('.log-message .pretty-jason-detail').length > 0) {
			$element.find('.log-message .pretty-jason-detail').each(function() {
				$(this).closest('.log-message').append($(this));
			});
		}

		$('.console-exception-level span.console-label,.console-trace-level span.console-label').click(function() {
			if ($(this).closest('.console-message').find('table').hasClass('hide')) {
				$(this).closest('.console-message').find('table').removeClass('hide');
			} else {
				$(this).closest('.console-message').find('table').addClass('hide');
			}

			return false;
		})
}

function getPrettyMsg(msg) {
	var data = msg.messages;
	var jason;

	if (data === true) {
		data = '<i>true</i>';
	} else if (data === false) {
		data = '<i>false</i>';
	} else if (data === undefined) {
		data = '<i>undefined</i>';
	} else if (data === null) {
		data = '<i>null</i>';
	} else if (data === '') {
		data = $('<div>').text(data).html();
	} else if (typeof data !== 'number') {
		try {
			jason = new PrettyJason(data);
		} catch(e) {
			data = $('<div>').text(data).html();
		}
	}

	if (jason) {
		return jason.generateHtml();
	} else {
		return data;
	}
}

function getPrettyTable(msg) {
	var data = msg.messages;

	var html = '<table class="console-data-grid">';

	html += '<thead><tr>';
	for (var i=0; i<msg.messages[1][0].length; i++) {
		html += '<th>' + msg.messages[1][0][i] + '</th>';
	}
	html += '</tr></thead>';

	html += '<tbody>';
	for (var i=1; i<msg.messages[1].length; i++) {
		html += '<tr>';
		for (var k=0; k< msg.messages[1][i].length; k++) {
			html += '<td>' + msg.messages[1][i][k] + '</td>';
		}
		html += '</tr>';
	}
	html += '</tbody>';

	html += '</table>';
	return html;
}


function getPrettyGroup(msg, nestLevel) {
	if (!msg || !msg.messages) {
		return '';
	}

	var data = msg.messages;
	var nestHtml = '';
	for(var i=0; i<nestLevel+1; i++) {
		nestHtml += '<div class="nesting-level-marker">&nbsp;</div>';
	}

	var $html = $('<div></div>');
	for(var i=0; i< data.length; i++ ) {
		var $element = $('<div class="console-message-wrapper">' + nestHtml + '<div class="log-message"></div></div>');
		getPrettyLog($element, data[i], nestLevel + 1);
		$html.append($element);
	}


	return $html.html();
}

function getPrettyException(msg) {
	var data = msg.messages;

	var html = '<table class="hide">';

	html += '<thead><tr><th>File</th><th>Line</th><th>Instruction</th></tr></thead>';

	html += '<tbody><tr><td>' + msg.messages.File + '</td><td>' + msg.messages.Line + '</td><td>throw Exception()</td></tr>' ;
	for (var i=0; i<msg.messages.Trace.length; i++) {
		html += '<tr>';
		html += '<td>' + msg.messages.Trace[i].file + '</td><td>' + msg.messages.Trace[i].line + '</td><td>' + msg.messages.Trace[i].function + '(' + JSON.stringify(msg.messages.Trace[i].args) + ')</td>';
		html += '</tr>';
	}
	html += '</tbody>';

	html += '</table>';
	return html;
}

function getPrettyTrace(msg) {
	var data = msg.messages;

	var html = '<table class="hide">';

	html += '<thead><tr><th>File</th><th>Line</th><th>Instruction</th></tr></thead>';

	html += '<tbody><tr><td>' + msg.messages.File + '</td><td>' + msg.messages.Line + '</td><td>' + msg.messages.Function + '(' + JSON.stringify(msg.messages.Args) + ')</td>';
	for (var i=0; i<msg.messages.Trace.length; i++) {
		html += '<tr>';
		html += '<td>' + msg.messages.Trace[i].file + '</td><td>' + msg.messages.Trace[i].line + '</td><td>' + msg.messages.Trace[i].function + '(' + JSON.stringify(msg.messages.Trace[i].args) + ')</td>';
		html += '</tr>';
	}
	html += '</tbody>';

	html += '</table>';
	return html;
}