(function(g){

"use strict";

g.PrettyJason = function(data)
{
	if (data instanceof Object) {
		this.data = data;
	} else {
		try {
			this.data = JSON.parse(data);
		} catch(e) {
			throw new PrettyJasonException('Input is not a valid JSON string.', e);
		}

		if (!(this.data instanceof Object)) {
			throw new PrettyJasonException('Input does not contain serialized object.');
		}
	}
};

g.PrettyJason.prototype.print = function(target)
{
	$(target).html(this.generateHtml());
};

g.PrettyJason.prototype.generateHtml = function()
{
	var $list = $('<ul class="pretty-jason"></ul>');
	var $li = $('<li></li>');
	var $item = $('<pre></pre>');


	var json = JSON.stringify(this.data);
	var preview = json.length > 50? json.substr(0, 50) + '...' : json;
	var $itemName = $('<span><span class="pretty-jason-icon"><i class="pretty-jason-icon-closed"></i></span> </span>');


	$item.append($itemName);
	$item.append(this._highlight(preview));
	$item.click(this._objectNodeClickedCallback);
	$li.append($item);

	var $clipboard = $('<i class="fa clipboard" aria-hidden="true" title="Copy!"></i>');
	new Clipboard($clipboard.get(0), {
		text: function(trigger) {
			return $(trigger).closest('td').find('ul.pretty-jason-detail pre').text();
		}
	});
	$li.append($clipboard);
	// $clipboard.click(this._copyClickedCallback);



	var json = JSON.stringify(this.data, undefined, 2);
	$li.append('<ul  class="pretty-jason-detail" style="display:none"><li><pre>' + this._highlight(json) + '</li></ul></pre>')

	$list.append($li);
	return $list;
};

g.PrettyJason.prototype._highlight = function(json)
{
	json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
		var cls = 'number';
		if (/^"/.test(match)) {
			if (/:$/.test(match)) {
				cls = 'key';
			} else {
				cls = 'string';
			}
		} else if (/true|false/.test(match)) {
			cls = 'boolean';
		} else if (/null/.test(match)) {
			cls = 'null';
		}
		return '<span class="' + cls + '">' + match + '</span>';
	});
};


g.PrettyJason.prototype._objectNodeClickedCallback = function()
{
	var $list = $(this).closest('td').find('ul.pretty-jason-detail');
	var $icon = $(this).find('i');

	$icon.removeClass('pretty-jason-icon-closed');
	$icon.removeClass('pretty-jason-icon-open');

	if ($list.css('display') == 'none') {
		$list.show();
		$icon.addClass('pretty-jason-icon-open');
	} else {
		$list.hide();
		$icon.addClass('pretty-jason-icon-closed');
	}
};

// g.PrettyJason.prototype._copyClickedCallback = function()
// {
// 	new Clipboard(, {
// 		target: function(trigger) {
// 			return trigger.nextElementSibling;
// 		}
// 	});
// };

g.PrettyJasonException = function(message, exception)
{
	this.message = message;
	this.exception = exception;
};

})(window);
