// VARIABLES
var socket = io.connect();
var editorHTML = CodeMirror.fromTextArea(document.getElementById('editorHTML'), {
	mode: "htmlmixed",
	theme: "default",
	lineNumbers: true,
	lineWrapping: true
});
var editorCSS = CodeMirror.fromTextArea(document.getElementById('editorCSS'), {
	mode: "css",
	theme: "default",
	lineNumbers: true,
	lineWrapping: true
});
var editorJS = CodeMirror.fromTextArea(document.getElementById('editorJS'), {
	mode: "javascript",
	theme: "default",
	lineNumbers: true,
	lineWrapping: true
});
var doc = editorHTML.getDoc();
var space = 0;
var selections = [];


// FUNCTIONS
function setWidthSpace() {
	editorHTML.setValue(" ");
	space = $('.CodeMirror-line span')[0].getBoundingClientRect().width;
}


// INITIALIZE
$(document).ready(function() {
	socket.emit('join', 'xyz', function(data, socketlist, socketid) {
		setWidthSpace();
		editorHTML.setValue(data);
		var mySocketId = socketid.replace('/#', '');
		socketlist.forEach(function (clientid) {
			if(mySocketId != clientid) {
				$('.CodeMirror-sizer').append('<div data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
			}
		});
	});
});


// EDITOR
editorHTML.setOption('extraKeys', {
	Tab: function(cm) {
		var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
		cm.replaceSelection(spaces);
	}
});

editorHTML.on('change', function(editor, data) {
	if(data.origin != 'change' && data.origin != 'setValue') {
		var char = data.from.ch;
		var line = data.from.line;
		var key = data.text;
		var cursor = editor.getCursor();
		socket.emit('change', data);
	}
});

editorHTML.on('cursorActivity', function(editor) {
	var cursor = editor.getCursor();
	var selection = editor.getSelections();
	if(selection[0].length > 0){
		socket.emit('client-selection', { from: editor.getCursor(true), to: editor.getCursor(false) });
	} else {
		socket.emit('client-selection-clear');
	}
	socket.emit('cursor-activty-client', cursor);
});


// SOCKET
socket.on('client-selection-receive', function(selection) {
	var clientid = selection.socketid.replace('/#', '');
	if(selections[clientid] !== undefined) {
		selections[clientid].clear();
	}
	selections[clientid] = doc.markText({line: selection.from.line, ch: selection.from.ch}, {line: selection.to.line, ch: selection.to.ch}, {
		className: 'custom-selection',
	});
});

socket.on('client-selection-clear-receive', function(clientId) {
	clientId = clientId.replace('/#', '');
	if(selections[clientId] !== undefined) {
		selections[clientId].clear();
	}
});

socket.on('client-joined', function(client) {
	var clientid = client.replace('/#', '');
	$('.CodeMirror-sizer').append('<div data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
});

socket.on('change-receive', function(data) {
	editorHTML.replaceRange(data.text, {line: data.from.line, ch: data.from.ch }, {line: data.to.line, ch: data.to.ch }, 'change');
});

socket.on('cursor-activty', function(cursor) {
	var clientid = cursor.socketid.replace('/#', '');
	var lineHeight = $('.CodeMirror-line').height();
	$('.custom-cursor[data-client='+clientid+']').css({
		"top": (cursor.line*lineHeight),
		"left": (((cursor.ch)*space))
	});
});

socket.on('getValue', function(callback) {
	callback(editorHTML.getValue());
});

socket.on('client-left', function(clientId){
	clientId = clientId.replace('/#', '');
	$('.custom-cursor[data-client='+clientId+']').remove();
});
