// VARIABLES
var socket = io.connect();
var editors = [];
editors['html'] = CodeMirror.fromTextArea(document.getElementById('editorHTML'), {
	mode: "htmlmixed",
	theme: "default",
	lineNumbers: true,
	lineWrapping: false
});
editors['css'] = CodeMirror.fromTextArea(document.getElementById('editorSCSS'), {
	mode: "text/x-scss",
	theme: "default",
	lineNumbers: true,
	lineWrapping: false
});
editors['js'] = CodeMirror.fromTextArea(document.getElementById('editorJS'), {
	mode: "javascript",
	theme: "default",
	lineNumbers: true,
	lineWrapping: false
});
var space = 0;
var selections = [];
selections['html'] = [];
selections['css'] = [];
selections['js'] = [];


// FUNCTIONS
function setWidthSpace() {
	editors['html'].setValue(" ");
	space = $('.CodeMirror-line span')[0].getBoundingClientRect().width;
}


// INITIALIZE
$(document).ready(function() {
	socket.emit('join', 'xyz', function(data, socketlist, socketid) {
		setWidthSpace();
		editors['html'].setValue(data);
		$('#sectionHTML').addClass('active');
		var mySocketId = socketid.replace('/#', '');
		socketlist.forEach(function (clientid) {
			if(mySocketId != clientid) {
				$('#sectionHTML .CodeMirror-sizer').append('<div data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
				$('#sectionSCSS .CodeMirror-sizer').append('<div data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
				$('#sectionJS .CodeMirror-sizer').append('<div data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
			}
		});
	});
});


// EDITOR
editors['html'].setOption('extraKeys', {
	Tab: function(cm) {
		var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
		cm.replaceSelection(spaces);
	}
});
editors['css'].setOption('extraKeys', {
	Tab: function(cm) {
		var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
		cm.replaceSelection(spaces);
	}
});
editors['js'].setOption('extraKeys', {
	Tab: function(cm) {
		var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
		cm.replaceSelection(spaces);
	}
});

editors['html'].on('change', function(editor, data) {
	console.log('change');
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
		data.editor = 'html';
		socket.emit('change', data);
	}
});
editors['css'].on('change', function(editor, data) {
	console.log('change');
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
		data.editor = 'css';
		socket.emit('change', data);
	}
});
editors['js'].on('change', function(editor, data) {
	console.log('change');
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
		data.editor = 'js';
		socket.emit('change', data);
	}
});


editors['html'].on('cursorActivity', function(editor) {
	var cursor = editor.getCursor();
	cursor.editor = 'html';
	var selection = editor.getSelections();
	if(selection[0].length > 0){
		socket.emit('client-selection', { from: editor.getCursor(true), to: editor.getCursor(false), editor: cursor.editor });
	} else {
		socket.emit('client-selection-clear', cursor.editor);
	}
	socket.emit('cursor-activty-client', cursor);
});
editors['css'].on('cursorActivity', function(editor) {
	var cursor = editor.getCursor();
	cursor.editor = 'css';
	var selection = editor.getSelections();
	if(selection[0].length > 0){
		socket.emit('client-selection', { from: editor.getCursor(true), to: editor.getCursor(false), editor: cursor.editor });
	} else {
		socket.emit('client-selection-clear', cursor.editor);
	}
	socket.emit('cursor-activty-client', cursor);
});
editors['js'].on('cursorActivity', function(editor) {
	var cursor = editor.getCursor();
	cursor.editor = 'js';
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
	$('#sectionSCSS .CodeMirror-sizer').append('<div data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
	$('#sectionJS .CodeMirror-sizer').append('<div data-client="'+clientid+'" class="custom-cursor" style="top:0px;left:0px;"></div>');
});

socket.on('change-receive', function(data) {
	editors[data.editor].replaceRange(data.text, {line: data.from.line, ch: data.from.ch }, {line: data.to.line, ch: data.to.ch }, 'change');
});

socket.on('cursor-activty', function(cursor) {
	var clientid = cursor.socketid.replace('/#', '');
	var lineHeight = $('.CodeMirror-line').height();
	var sectionHTML = '';
	if(cursor.editor == 'html'){
		sectionHTML = 'sectionHTML';
	} else if(cursor.editor == 'css') {
		sectionHTML = 'sectionSCSS';
	} else if(cursor.editor == 'js') {
		sectionHTML = 'sectionJS';
	}
	$('#' + sectionHTML + ' .custom-cursor[data-client='+clientid+']').css({
		"top": (cursor.line*lineHeight),
		"left": (((cursor.ch)*space))
	});
});

socket.on('getValue', function(callback) {
	callback(editors['html'].getValue());
});

socket.on('client-left', function(clientId){
	clientId = clientId.replace('/#', '');
	$('#sectionHTML .custom-cursor[data-client='+clientId+']').remove();
	$('#sectionSCSS .custom-cursor[data-client='+clientId+']').remove();
	$('#sectionJS .custom-cursor[data-client='+clientId+']').remove();
});


$('#tabs li').on('click', function() {
	var editor = $(this).data('editor');

	$('#tabs li').removeClass('active');
	$(this).addClass('active');

	$('section').removeClass('active');
	$('#section'+editor).addClass('active');
});
