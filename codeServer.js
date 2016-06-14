var express = require('express');
var app = express();
var LEX = require('letsencrypt-express').testing();
var https = require('spdy');
var http = require('http');
var fs = require("fs");
var socketlist = [];
var socketinfolist = [];

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
    if(socketinfolist[room] == null){
      socketinfolist[room] = [];
    }
		socket.join(room);
		socket.room = room;
    socket.socketinfo = {};
    socket.socketinfo.room = room;
    socket.socketinfo.clientid = socket.id;
    socket.socketinfo.usernumber = getNextUsernumber(socketlist[room]);
    socketlist[room].push(socket);
    socketinfolist[room].push(socket.socketinfo);
    var projectPath = './public/pen/' + room;
		console.log('Sockets in Room: ' + room + ' - ' + socketlist[room].length);
		if(socketlist[room].length > 1) {
			var ownersocket = socketlist[room][0];
			ownersocket.emit('getValue', function(editorContent) {
        fs.writeFileSync(projectPath + '/index.html', editorContent.html);
        fs.writeFileSync(projectPath + '/style.css', editorContent.css);
        fs.writeFileSync(projectPath + '/script.js', editorContent.js);
				callback(editorContent, socketinfolist[room], socket.socketinfo);
			});
		} else {
      var fileContents = {};
      try {
          fs.statSync(projectPath).isDirectory();
          fileContents.html = fs.readFileSync(projectPath + '/index.html' ,'utf8');
          fileContents.css = fs.readFileSync(projectPath + '/style.css' ,'utf8');
          fileContents.js = fs.readFileSync(projectPath + '/script.js' ,'utf8');
          callback(fileContents, socketinfolist[room], socket.socketinfo);
      }
      catch (err) {
        fs.mkdirSync(projectPath);
        fs.writeFileSync(projectPath + '/index.html', '<!-- HTML -->');
        fs.writeFileSync(projectPath + '/style.css', '/* CSS */');
        fs.writeFileSync(projectPath + '/script.js', '// JavaScript');
        fileContents.html = fs.readFileSync(projectPath + '/index.html' ,'utf8');
        fileContents.css = fs.readFileSync(projectPath + '/style.css' ,'utf8');
        fileContents.js = fs.readFileSync(projectPath + '/script.js' ,'utf8');
        callback(fileContents, socketinfolist[room], socket.socketinfo);
      }
		}
		socket.broadcast.to(socket.room).emit('client-joined', socket.socketinfo);
	});


	socket.on('change', function (data) {
		//console.log(data);
		socket.broadcast.to(socket.room).emit('change-receive', data);
	});

	socket.on('cursor-activty-client', function (cursor) {
		cursor.socketid = socket.id;
		//console.log(cursor);
		socket.broadcast.to(socket.room).emit('cursor-activty', cursor);
	});

  socket.on('client-selection', function (selection) {
		selection.socketinfo = socket.socketinfo;
		//console.log(selection);
		socket.broadcast.to(socket.room).emit('client-selection-receive', selection);
	});

  socket.on('client-selection-clear', function (editor) {
		socket.broadcast.to(socket.room).emit('client-selection-clear-receive', {socketinfo: socket.socketinfo, editor: editor});
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
      var j = socketinfolist[socket.room].indexOf(socket.socketinfo);
      socketlist[socket.room].splice(i, 1);
      socketinfolist[socket.room].splice(j, 1);
	    io.to(socket.room).emit('client-left', socket.id);
   });
});

function getNextUsernumber (socketlist){
  if(socketlist.length == 0){
    return 1;
  }
  for (i = 1; i <= 4; i++) {
    var foundFreeNumber = true;
    for (j = 0; j < socketlist.length; j++) {
      if(socketlist[j].socketinfo.usernumber == i) {
        foundFreeNumber = false;
        break;
      }
    }
    if(foundFreeNumber){
      return i;
    }
  }
  return 1;
}
