var express = require('express');
var app = express();
var LEX = require('letsencrypt-express').testing();
var https = require('spdy');
var http = require('http');
var fs = require("fs");
var socketlist = [];

app.use(express.static(__dirname + '/public'));

//letsencrypt https config
var lex = LEX.create({
  configDir: '/etc/letsencrypt',
  approveRegistration: function (hostname, cb) {
    cb(null, {
      domains: ['code.puhn.co']
    , email: 'madetho@live.de'
    , agreeTos: true
    });
  }
});

//var server = https.createServer(lex.httpsOptions, LEX.createAcmeResponder(lex, app));
var server = http.createServer(app);
var io = require('socket.io')(server);
server.listen(8888, function () {
  console.log('Listening on 8888');
});

io.on('connection', function(socket){
	socket.on('join', function(room, callback) {
    room = 'test';
    if(socketlist[room] == null){
      socketlist[room] = [];
    }
    socketlist[room].push(socket);
		socket.join(room);
		socket.room = room;
    var projectPath = './public/pen/' + room;
		console.log('Sockets in Room: ' + room + ' - ' + socketlist[room].length);
		if(socketlist[room].length > 1) {
			var ownersocket = socketlist[room][0];
			ownersocket.emit('getValue', function(editorContent) {
        fs.writeFileSync(projectPath + '/index.html', editorContent.html);
        fs.writeFileSync(projectPath + '/style.css', editorContent.css);
        fs.writeFileSync(projectPath + '/script.js', editorContent.js);
				callback(editorContent, Object.keys(io.engine.clients), socket.id);
			});
		} else {
      var fileContents = {};
      try {
          fs.statSync(projectPath).isDirectory();
          fileContents.html = fs.readFileSync(projectPath + '/index.html' ,'utf8');
          fileContents.css = fs.readFileSync(projectPath + '/style.css' ,'utf8');
          fileContents.js = fs.readFileSync(projectPath + '/script.js' ,'utf8');
          callback(fileContents, Object.keys(io.engine.clients), socket.id);
      }
      catch (err) {
        fs.mkdirSync(projectPath);
        fs.writeFileSync(projectPath + '/index.html', '<!-- HTML -->');
        fs.writeFileSync(projectPath + '/style.css', '/* CSS */');
        fs.writeFileSync(projectPath + '/script.js', '// JavaScript');
        fileContents.html = fs.readFileSync(projectPath + '/index.html' ,'utf8');
        fileContents.css = fs.readFileSync(projectPath + '/style.css' ,'utf8');
        fileContents.js = fs.readFileSync(projectPath + '/script.js' ,'utf8');
        callback(fileContents, Object.keys(io.engine.clients), socket.id);
      }
		}
		socket.broadcast.to(socket.room).emit('client-joined', socket.id);
	});


	socket.on('change', function (data) {
		console.log(data);
		socket.broadcast.to(socket.room).emit('change-receive', data);
	});

	socket.on('cursor-activty-client', function (cursor) {
		cursor.socketid = socket.id;
		console.log(cursor);
		socket.broadcast.to(socket.room).emit('cursor-activty', cursor);
	});

  socket.on('client-selection', function (selection) {
		selection.socketid = socket.id;
		console.log(selection);
		socket.broadcast.to(socket.room).emit('client-selection-receive', selection);
	});

  socket.on('client-selection-clear', function (editor) {
		socket.broadcast.to(socket.room).emit('client-selection-clear-receive', {socketid: socket.id, editor: editor});
	});

  socket.on('blur', function (editor) {
		var data = {};
    data.editor = editor;
    data.socketid = socket.id;
		socket.broadcast.to(socket.room).emit('hide-cursor', data);
	});

  socket.on('focus', function (editor) {
		var data = {};
    data.editor = editor;
    data.socketid = socket.id;
		socket.broadcast.to(socket.room).emit('show-cursor', data);
	});

	socket.on('disconnect', function() {
      console.log('Room: ' + socket.room + ' id: ' + socket.id + 'Got disconnect!');
      var i = socketlist[socket.room].indexOf(socket);
      socketlist[socket.room].splice(i, 1);
	  io.to(socket.room).emit('client-left', socket.id);
   });
});
