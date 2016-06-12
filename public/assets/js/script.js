// VARIABLES
var socket = io.connect();
var editors = [];
editors['HTML'] = CodeMirror.fromTextArea(document.getElementById('editorHTML'), {
	mode: "htmlmixed",
	lineNumbers: true,
	lineWrapping: false,
	scrollbarStyle: "simple",
	autoCloseBrackets: true,
	matchBrackets: true,
	autoCloseTags: true,
	autofocus: true
});
editors['CSS'] = CodeMirror.fromTextArea(document.getElementById('editorCSS'), {
	mode: "text/css",
	lineNumbers: true,
	lineWrapping: false,
	scrollbarStyle: "simple",
	autoCloseBrackets: true,
	matchBrackets: true
});
editors['JS'] = CodeMirror.fromTextArea(document.getElementById('editorJS'), {
	mode: "javascript",
	lineNumbers: true,
	lineWrapping: false,
	scrollbarStyle: "simple",
	autoCloseBrackets: true,
	matchBrackets: true
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


// FUNCTIONS
function setWidthSpace() {
	editors['HTML'].setValue(" ");
	editors['CSS'].setValue(" ");
	editors['JS'].setValue(" ");
	space = $('.CodeMirror-line span')[0].getBoundingClientRect().width;
}


// INITIALIZE
$(document).ready(function() {
	socket.emit('join', 'xyz', function(data, socketlist, socketid) {
		setWidthSpace();
		editors['HTML'].setValue(data);
		$('#tabs li[data-editor="HTML"]').addClass('active');
		$('section').not('#sectionHTML').addClass('inactive');
		$('#sectionHTML').addClass('active');
		var mySocketId = socketid.replace('/#', '');
		socketlist.forEach(function (clientid) {
			if(mySocketId != clientid) {
				$('#sectionHTML .CodeMirror-sizer').append('<div data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
				$('#sectionCSS .CodeMirror-sizer').append('<div data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
				$('#sectionJS .CodeMirror-sizer').append('<div data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
			}
		});
	});
});


// EDITORS
editors['HTML'].setOption('extraKeys', {
	Tab: function(cm) {
		var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
		cm.replaceSelection(spaces);
	}
});
editors['CSS'].setOption('extraKeys', {
	Tab: function(cm) {
		var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
		cm.replaceSelection(spaces);
	}
});
editors['JS'].setOption('extraKeys', {
	Tab: function(cm) {
		var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
		cm.replaceSelection(spaces);
	}
});

editors['HTML'].on('focus', function(editor) {
	console.log('html focus');
});
editors['CSS'].on('focus', function(editor) {
	console.log('css focus');
});
editors['JS'].on('focus', function(editor) {
	console.log('js focus');
});

editors['HTML'].on('blur', function(editor) {
	console.log('html blur');
});
editors['CSS'].on('blur', function(editor) {
	console.log('css blur');
});
editors['JS'].on('blur', function(editor) {
	console.log('js blur');
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
		var char = data.from.ch;
		var line = data.from.line;
		var key = data.text;
		var cursor = editor.getCursor();
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
		var char = data.from.ch;
		var line = data.from.line;
		var key = data.text;
		var cursor = editor.getCursor();
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
		var char = data.from.ch;
		var line = data.from.line;
		var key = data.text;
		var cursor = editor.getCursor();
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
	var clientId = selection.socketid.replace('/#', '');
	if(selections[selection.editor] !== undefined && selections[selection.editor][clientId] !== undefined) {
		selections[selection.editor][clientId].clear();
	}
	selections[selection.editor][clientId] = editors[selection.editor].getDoc().markText({line: selection.from.line, ch: selection.from.ch}, {line: selection.to.line, ch: selection.to.ch}, {
		className: 'custom-selection',
	});
});

socket.on('client-selection-clear-receive', function(data) {
	var clientId = data.socketid.replace('/#', '');
	if(selections[data.editor] !== undefined && selections[data.editor][clientId] !== undefined) {
		selections[data.editor][clientId].clear();
	}
});

socket.on('client-joined', function(client) {
	var clientid = client.replace('/#', '');
	$('#sectionHTML .CodeMirror-sizer').append('<div data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
	$('#sectionCSS .CodeMirror-sizer').append('<div data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
	$('#sectionJS .CodeMirror-sizer').append('<div data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
});

socket.on('change-receive', function(data) {
	editors[data.editor].replaceRange(data.text, {line: data.from.line, ch: data.from.ch }, {line: data.to.line, ch: data.to.ch }, 'change');
});

socket.on('cursor-activty', function(cursor) {
	var clientid = cursor.socketid.replace('/#', '');
	var lineHeight = $('.CodeMirror-line').height();
	var sectionHTML = '';
	if(cursor.editor == 'HTML'){
		sectionHTML = 'sectionHTML';
	} else if(cursor.editor == 'CSS') {
		sectionHTML = 'sectionCSS';
	} else if(cursor.editor == 'JS') {
		sectionHTML = 'sectionJS';
	}
	$('#' + sectionHTML + ' .custom-cursor[data-client='+clientid+']').css({
		"top": (cursor.line*lineHeight),
		"left": (((cursor.ch)*space))
	});
});

socket.on('getValue', function(callback) {
	callback(editors['HTML'].getValue());
});

socket.on('client-left', function(clientId){
	clientId = clientId.replace('/#', '');
	$('#sectionHTML .custom-cursor[data-client='+clientId+']').remove();
	$('#sectionSCSS .custom-cursor[data-client='+clientId+']').remove();
	$('#sectionJS .custom-cursor[data-client='+clientId+']').remove();
});


// TABS
$('#tabs li').on('click', function() {
	var editor = $(this).data('editor');

	$('#tabs li').removeClass('active');
	$('#tabs li[data-editor="'+editor+'"]').addClass('active');

	$('section').removeClass('active');
	$('section').removeClass('inactive');
	$('section').not('#section'+editor).addClass('inactive');
	$('#section'+editor).addClass('active');

	editors[editor].focus();
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