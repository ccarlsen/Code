// VARIABLES
var socket = io.connect();
var editors = [];
var usercount  = 0;
var userlimit = 4;
editors['HTML'] = CodeMirror.fromTextArea(document.getElementById('editorHTML'), {
	mode: "htmlmixed",
	cursorBlinkRate: 0,
	lineNumbers: true,
	lineWrapping: false,
	scrollbarStyle: "simple",
	matchBrackets: true,
	autoCloseBrackets: true,
	matchTags: {bothTags: true},
	autoCloseTags: true,
	autofocus: true
});

editors['CSS'] = CodeMirror.fromTextArea(document.getElementById('editorCSS'), {
	mode: "text/x-scss",
	cursorBlinkRate: 0,
	lineNumbers: true,
	lineWrapping: false,
	scrollbarStyle: "simple",
	matchBrackets: true,
	autoCloseBrackets: true
});
editors['JS'] = CodeMirror.fromTextArea(document.getElementById('editorJS'), {
	mode: "javascript",
	cursorBlinkRate: 0,
	lineNumbers: true,
	lineWrapping: false,
	scrollbarStyle: "simple",
	matchBrackets: true,
	autoCloseBrackets: true
});
var space = 0;
var selections = [];
selections['HTML'] = [];
selections['CSS'] = [];
selections['JS'] = [];
var asideWidth = localStorage.getItem('asideWidth');
var mainWidth = localStorage.getItem('mainWidth');
if (asideWidth == null && mainWidth == null) {
	asideWidth = 50;
	mainWidth = 50;
} else {
	asideWidth = parseInt(asideWidth);
	mainWidth = parseInt(mainWidth);
}
var showChat = localStorage.getItem('showChat');
if (showChat == null) {
	showChat = 'true';
}
var darkMode = localStorage.getItem('darkMode');
if (darkMode == null) {
	darkMode = 'off';
}


// FUNCTIONS
function setWidthSpace() {
	editors['HTML'].setValue(" ");
	editors['CSS'].setValue(" ");
	editors['JS'].setValue(" ");
	space = $('.CodeMirror-line span')[0].getBoundingClientRect().width;
}
function getSectionSelectorByType(typ) {
	if(typ == 'HTML'){
		return 'sectionHTML';
	} else if(typ == 'CSS') {
		return 'sectionCSS';
	} else if(typ == 'JS') {
		return 'sectionJS';
	}
	return '';
}
function clearSelection(editorTyp, clientId){
	if(selections[editorTyp] !== undefined && selections[editorTyp][clientId] !== undefined) {
		selections[editorTyp][clientId].clear();
	}
}
function refreshFrame() {
	$('#resultFrame').attr('src', '/project/'+room+'/full/index.html');
}
function generatePassword() {
	var length = 8;
	var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	var retVal = "";
	for (var i = 0, n = charset.length; i < length; ++i) {
		retVal += charset.charAt(Math.floor(Math.random() * n));
	}
	return retVal;
}


// INITIALIZE
$(document).ready(function() {
	socket.emit('join', room, function(data, socketinfolist, mySocketInfo) {
		if(mySocketInfo == null){
			alert(data.error);
			return;
		}
		usercount = socketinfolist.length
		setWidthSpace();
		refreshFrame();
		editors['HTML'].setValue(data.html);
		editors['CSS'].setValue(data.css);
		editors['JS'].setValue(data.js);
		$('#additionalCSS').val(data.csslinks);
		$('#additionalJS').val(data.jslinks);
		$('#tabs li[data-editor="HTML"]').addClass('active');
		$('section').not('#sectionHTML').addClass('inactive');
		$('#sectionHTML').addClass('active');
		$('#chat .chatHeader strong').html(usercount + '/' + userlimit);
		var mySocketId = mySocketInfo.clientid.replace('/#', '');
		socketinfolist.forEach(function (socketinfo) {
			var clientid = socketinfo.clientid.replace('/#', '');
			if(mySocketId != clientid) {
				$('#sectionHTML .CodeMirror-sizer').append('<div data-user="'+socketinfo.usernumber+'" data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
				$('#sectionCSS .CodeMirror-sizer').append('<div data-user="'+socketinfo.usernumber+'" data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
				$('#sectionJS .CodeMirror-sizer').append('<div data-user="'+socketinfo.usernumber+'" data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
			} else {
				$('body').attr('data-user', socketinfo.usernumber);
				$('#favicon').attr('href', 'assets/favicons/favicon-'+socketinfo.usernumber+'.png');
			}
			$('#tabs li[data-editor="'+socketinfo.activeTab+'"] span').append('<i data-user="'+socketinfo.usernumber+'"></i>');
		});
	});
});


// EDITORS
editors['HTML'].setOption('extraKeys', {
	Tab: function(cm) {
		var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
		cm.replaceSelection(spaces);
	},
	"Ctrl-Space": function(cm) {
		CodeMirror.showHint(cm, CodeMirror.hint.html);
	}
});
editors['CSS'].setOption('extraKeys', {
	Tab: function(cm) {
		var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
		cm.replaceSelection(spaces);
	},
	"Ctrl-Space": function(cm) {
		CodeMirror.showHint(cm, CodeMirror.hint.css);
	}
});
editors['JS'].setOption('extraKeys', {
	Tab: function(cm) {
		var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
		cm.replaceSelection(spaces);
	},
	"Ctrl-Space": function(cm) {
		CodeMirror.showHint(cm, CodeMirror.hint.js);
	}
});

editors['HTML'].on('focus', function(editor) {
	socket.emit('focus', 'HTML');
});
editors['CSS'].on('focus', function(editor) {
	socket.emit('focus', 'CSS');
});
editors['JS'].on('focus', function(editor) {
	socket.emit('focus', 'JS');
});

editors['HTML'].on('blur', function(editor) {
	socket.emit('blur', 'HTML');
});
editors['CSS'].on('blur', function(editor) {
	socket.emit('blur', 'CSS');
});
editors['JS'].on('blur', function(editor) {
	socket.emit('blur', 'JS');
});

editors['HTML'].on('change', function(editor, data) {
	if(data.origin == "paste") {
		var lineFrom = data.from.line;
	  var lineTo = data.from.line + data.text.length;

	  function reindentLines(editor, lineFrom, lineTo) {
	      editor.operation(function() {
	          editor.eachLine(lineFrom, lineTo, function(lineHandle) {
	              editor.indentLine(lineHandle.lineNo(), "smart");
	          });
	      });
	  }
	  reindentLines(editor, lineFrom, lineTo);
	}

	if(data.origin != 'change' && data.origin != 'setValue') {
		data.editor = 'HTML';
		socket.emit('change', data);
	}
});
editors['CSS'].on('change', function(editor, data) {
	if(data.origin == "paste") {
		var lineFrom = data.from.line;
	  var lineTo = data.from.line + data.text.length;

	  function reindentLines(editor, lineFrom, lineTo) {
	      editor.operation(function() {
	          editor.eachLine(lineFrom, lineTo, function(lineHandle) {
	              editor.indentLine(lineHandle.lineNo(), "smart");
	          });
	      });
	  }
	  reindentLines(editor, lineFrom, lineTo);
	}

	if(data.origin != 'change' && data.origin != 'setValue') {
		data.editor = 'CSS';
		socket.emit('change', data);
	}
});
editors['JS'].on('change', function(editor, data) {
	if(data.origin == "paste") {
		var lineFrom = data.from.line;
	  var lineTo = data.from.line + data.text.length;

	  function reindentLines(editor, lineFrom, lineTo) {
	      editor.operation(function() {
	          editor.eachLine(lineFrom, lineTo, function(lineHandle) {
	              editor.indentLine(lineHandle.lineNo(), "smart");
	          });
	      });
	  }
	  reindentLines(editor, lineFrom, lineTo);
	}

	if(data.origin != 'change' && data.origin != 'setValue') {
		data.editor = 'JS';
		socket.emit('change', data);
	}
});

editors['HTML'].on('cursorActivity', function(editor) {
	var cursor = editor.getCursor();
	cursor.editor = 'HTML';
	var selection = editor.getSelections();
	if(selection[0].length > 0){
		socket.emit('client-selection', { from: editor.getCursor(true), to: editor.getCursor(false), editor: cursor.editor });
	} else {
		socket.emit('client-selection-clear', cursor.editor);
	}
	socket.emit('cursor-activty-client', cursor);
});
editors['CSS'].on('cursorActivity', function(editor) {
	var cursor = editor.getCursor();
	cursor.editor = 'CSS';
	var selection = editor.getSelections();
	if(selection[0].length > 0){
		socket.emit('client-selection', { from: editor.getCursor(true), to: editor.getCursor(false), editor: cursor.editor });
	} else {
		socket.emit('client-selection-clear', cursor.editor);
	}
	socket.emit('cursor-activty-client', cursor);
});
editors['JS'].on('cursorActivity', function(editor) {
	var cursor = editor.getCursor();
	cursor.editor = 'JS';
	var selection = editor.getSelections();
	if(selection[0].length > 0){
		socket.emit('client-selection', { from: editor.getCursor(true), to: editor.getCursor(false), editor: cursor.editor });
	} else {
		socket.emit('client-selection-clear', cursor.editor);
	}
	socket.emit('cursor-activty-client', cursor);
});


// SOCKET
socket.on('client-selection-receive', function(selection) {
	var clientId = selection.socketinfo.clientid.replace('/#', '');
	clearSelection(selection.editor, clientId);
	var classname = 'custom-selection-' + selection.socketinfo.usernumber;
	selections[selection.editor][clientId] = editors[selection.editor].getDoc().markText({line: selection.from.line, ch: selection.from.ch}, {line: selection.to.line, ch: selection.to.ch}, {
		className: classname,
	});
});

socket.on('client-selection-clear-receive', function(data) {
	var clientId = data.socketinfo.clientid.replace('/#', '');
	clearSelection(data.editor, clientId);
});

socket.on('client-joined', function(socketinfo) {
	var clientid = socketinfo.clientid.replace('/#', '');
	usercount++;
	$('#chat .chatHeader strong').html(usercount + '/' + userlimit);
	$('#sectionHTML .CodeMirror-sizer').append('<div data-user="'+socketinfo.usernumber+'" data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
	$('#sectionCSS .CodeMirror-sizer').append('<div data-user="'+socketinfo.usernumber+'" data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
	$('#sectionJS .CodeMirror-sizer').append('<div data-user="'+socketinfo.usernumber+'" data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
	$('#tabs li[data-editor="'+socketinfo.activeTab+'"] span').append('<i data-user="'+socketinfo.usernumber+'"></i>');
});

socket.on('change-receive', function(data) {
	editors[data.editor].replaceRange(data.text, {line: data.from.line, ch: data.from.ch }, {line: data.to.line, ch: data.to.ch }, 'change');
});

socket.on('cursor-activty', function(cursor) {
	var clientid = cursor.socketid.replace('/#', '');
	var lineHeight = $('.CodeMirror-line').height();
	getSectionSelectorByType(cursor.editor);
	$('#' + getSectionSelectorByType(cursor.editor) + ' .custom-cursor[data-client='+clientid+']').css({
		"top": (cursor.line*lineHeight),
		"left": (((cursor.ch)*space))
	});
});

socket.on('getValue', function(callback) {
	var editorContent = {};
	editorContent.html = editors['HTML'].getValue();
	editorContent.css = editors['CSS'].getValue();
	editorContent.js = editors['JS'].getValue();
	editorContent.jslinks = $('#additionalJS').val();
	editorContent.csslinks = $('#additionalCSS').val();
	callback(editorContent);
});

socket.on('hide-cursor', function(data) {
	var clientid = data.socketid.replace('/#', '');
	$('#' + getSectionSelectorByType(data.editor) + ' .custom-cursor[data-client='+clientid+']').css('visibility', 'hidden');
});

socket.on('show-cursor', function(data) {
	var clientid = data.socketid.replace('/#', '');
	$('#' + getSectionSelectorByType(data.editor) + ' .custom-cursor[data-client='+clientid+']').css('visibility', 'visible');
});

socket.on('switch-tab-receive', function(socketinfo) {
	$('#tabs li span i[data-user="'+socketinfo.usernumber+'"]').remove();
	$('#tabs li[data-editor="'+socketinfo.activeTab+'"] span').append('<i data-user="'+socketinfo.usernumber+'"></i>');
});

socket.on('autosave-receive', function(editorContent) {
	refreshFrame();
	$('#additionalCSS').val(editorContent.csslinks);
	$('#additionalJS').val(editorContent.jslinks);
});

socket.on('sass-compile-error', function(sassErrorMessage) {
	if(sassErrorMessage !== null) {
		$('#errorCSS').text(sassErrorMessage);
		$('#sectionCSS').addClass('error');
	} else {
		$('#errorCSS').text('');
		$('#sectionCSS').removeClass('error');
	}
});

socket.on('client-left', function(socketinfo){
	clientId = socketinfo.clientid.replace('/#', '');
	usercount--;
	$('#chat .chatHeader strong').html(usercount + '/' + userlimit);
	$('#sectionHTML .custom-cursor[data-client='+clientId+']').remove();
	$('#sectionCSS .custom-cursor[data-client='+clientId+']').remove();
	$('#sectionJS .custom-cursor[data-client='+clientId+']').remove();
	$('#tabs li span i[data-user="'+socketinfo.usernumber+'"]').remove();
	clearSelection('HTML', clientId);
	clearSelection('CSS', clientId);
	clearSelection('JS', clientId);
});


// TABS
$('#tabs li').on('click', function() {
	var editor = $(this).data('editor');

	socket.emit('switch-tab', editor);
	$('#tabs li').removeClass('active');
	$('#tabs li[data-editor="'+editor+'"]').addClass('active');

	$('section').removeClass('active');
	$('section').removeClass('inactive');
	$('section').not('#section'+editor).addClass('inactive');
	$('#section'+editor).addClass('active');

	editors[editor].focus();
	editors[editor].refresh();
});


// OPTIONS
$('#options').on('click', function() {
	$(this).toggleClass('open');
});
$('#options, #options form').on('click', function(event) {
	event.stopPropagation();
});
$('body').on('click', function() {
	$('#options').removeClass('open');
});

$('#additionalCSS').on('change', function() {
	socket.emit('update-resource', {value: $('#additionalCSS').val(), mode: 'CSS'})
});

$('#additionalJS').on('change', function() {
	socket.emit('update-resource', {value: $('#additionalJS').val(), mode: 'JS'})
});


// PRIVATE PROJECT
$('#privateProject').on('change', function() {
	if ($(this).is(':checked')) {
		$('#projectPassword').val(generatePassword());
		console.log('Password was created!');
	}
});
$('#projectPassword').on('change', function() {
	var val = $(this).val();
	if (val.length == 0) {
		$('#projectPassword').val(generatePassword());
		console.log('Password was changed!');
	} else {
		console.log('Password was changed!');
	}
});


// SHOW CHAT
$('#showChat').on('change', function() {
	if ($(this).is(':checked')) {
		localStorage.setItem('showChat', 'true');
		$('body').attr('data-showchat', 'true');
	} else {
		localStorage.setItem('showChat', 'false');
		$('body').attr('data-showchat', 'false');
	}
});
$(document).ready(function() {
	$('body').attr('data-showchat', showChat);
	if ($('body').attr('data-showchat') == 'true') {
		$('#showChat').prop('checked', true);
	} else {
		$('#showChat').prop('checked', false);
	}
});


// DARK MODE
$('#darkMode').on('change', function() {
	if ($(this).is(':checked')) {
		localStorage.setItem('darkMode', 'on');
		$('body').attr('data-darkmode', 'on');
	} else {
		localStorage.setItem('darkMode', 'off');
		$('body').attr('data-darkmode', 'off');
	}
});
$(document).ready(function() {
	$('body').attr('data-darkmode', darkMode);
	if ($('body').attr('data-darkmode') == 'on') {
		$('#darkMode').prop('checked', true);
	} else {
		$('#darkMode').prop('checked', false);
	}
});


// SPLIT.JS
Split(['aside', 'main'], {
	sizes: [asideWidth, mainWidth],
	gutterSize: 9,
	minSize: 500,
	onDrag: function() {
		editors['HTML'].setSize('100%', '100%');
		editors['CSS'].setSize('100%', '100%');
		editors['JS'].setSize('100%', '100%');
	},
	onDragEnd: function() {
		var regex1 = /(100|[0-9]{1,2})(\.[0-9]{1,8})?/g;
		var regex2 = /(100|[0-9]{1,2})(\.[0-9]{1,8})?/g;
		var aside = $('aside').attr('style');
		var main = $('main').attr('style');
		aside = regex1.exec(aside);
		main = regex2.exec(main);
		aside = Math.round(aside[0]);
		main = Math.round(main[0]);
		localStorage.setItem('asideWidth', aside);
		localStorage.setItem('mainWidth', main);
	}
});


// CHAT
var emoji = [
	{ "file": "astonished.png", "shortcut": "XO" },
	{ "file": "confused.png", "shortcut": ":/" },
	{ "file": "crying.png", "shortcut": ":'O" },
	{ "file": "expressionless.png", "shortcut": "-_-" },
	{ "file": "frowning.png", "shortcut": ":(" },
	{ "file": "grinning.png", "shortcut": ":D" },
	{ "file": "neutral.png", "shortcut": ":I" },
	{ "file": "openmouth.png", "shortcut": ":O" },
	{ "file": "screaming.png", "shortcut": "8O" },
	{ "file": "sleeping.png", "shortcut": "zzz" },
	{ "file": "smiling.png", "shortcut": ":)" },
	{ "file": "tear.png", "shortcut": ":'(" },
	{ "file": "tongue.png", "shortcut": ":P" },
	{ "file": "winking.png", "shortcut": ";)" }
];
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
function placeCaretAtEnd() {
	var el = document.getElementById("chatInput");
	if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
		var sel = window.getSelection();
		var range = document.createRange();
		range.selectNodeContents(el);
		range.collapse(false);
		sel.removeAllRanges();
		sel.addRange(range);
	} else if (typeof document.body.createTextRange != "undefined") {
		var textRange = document.body.createTextRange();
		textRange.moveToElementText(el);
		textRange.collapse(false);
		textRange.select();
	}
	el.focus();
}
function insertEmoji(emoji) {
	var sel = window.getSelection();
	var range = sel.getRangeAt(0);
	var selectedText = range.toString();
	var newNode = document.createElement('img');
	range.deleteContents();
	newNode.setAttribute("src", "assets/emoji/" + emoji.file);
	newNode.setAttribute("title", '');
	range.insertNode(newNode);
	range.setStartAfter(newNode);
	range.setEndAfter(newNode);
	sel.removeAllRanges();
	sel.addRange(range);
}
function scrollToBottomTimeago() {
	$('time').timeago();
	$('#chat .chatMessages').scrollTop($('#chat .chatMessages')[0].scrollHeight);
}
$('#chat .chatHeader i').on('click', function() {
	if($('#chat').hasClass('open')) {
		$('#chat').removeClass('open');
	} else {
		unreadMessageCount = 0;
		$('#chat').addClass('open');
		$('#chat .chatHeader span').hide();
		scrollToBottomTimeago();
		placeCaretAtEnd();
	}
});
$('#chatInput').on('input', function() {
	var content = $(this).html();
	for(var i = 0; i < emoji.length; i++) {
		var regex = new RegExp(escapeRegExp(emoji[i].shortcut));
		if(content.match(regex)) {
			insertEmoji(emoji[i]);
			$(this).contents().filter(function() {
				return this.nodeType === 3;
			}).each(function() {
				$(this).replaceWith($(this).text().replace(regex, ''));
			});
		}
	}
});
$('#chatInput').on('keypress', function(event) {
	var data = {};
	data.content = $(this).html();
	data.tagName =  '';
	var date = new Date();
	if (event.which == 13) {
		if (!data.content == '') {
			$(this).html('');
			socket.emit('send-message', data);
		}
		return false;
	}
});
var unreadMessageCount = 0;
socket.on('message-receive', function(data) {
	var date = new Date();
	var lastUsernumber = $('#chat .chatMessage:last-child').data('user');
	if(lastUsernumber !== data.client.usernumber) {
		if(data.tagName == 'IMG') {
			$('#chat .chatMessages').append('<div class="chatMessage" data-user="'+data.client.usernumber+'" data-onlyemoji="true"><div>'+data.content+'<time datetime="' + date.toISOString() + '"></time></div></div>');
		} else {
			$('#chat .chatMessages').append('<div class="chatMessage" data-user="'+data.client.usernumber+'" data-onlyemoji="false"><div>'+data.content+'<time datetime="' + date.toISOString() + '"></time></div></div>');
		}
	} else {
		$('#chat .chatMessage:last-child').append('<div>'+data.content+'<time datetime="' + date.toISOString() + '"></time></div>');
	}
	if(!$('#chat').hasClass('open')) {
		$('#chat .chatHeader span').show();
		unreadMessageCount++;
		$('#chat .chatHeader span').text(unreadMessageCount);
	}
	scrollToBottomTimeago();
});
