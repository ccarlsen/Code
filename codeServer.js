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
	console.log('a user connected');
	socketlist.push(socket);

	socket.on('join', function(room, callback) {
		socket.join(room);
		socket.room = room;
		console.log('socketlist length: ' + socketlist.length);
		if(socketlist.length > 1) {
			var ownersocket = socketlist[0];
			ownersocket.emit('getValue', function(data) {
				fs.writeFile("./public/pen/xyz/index.html", data, function(err) {
					if(err) {
						return console.log(err);
					}
					console.log("The file was saved!");
				});
				callback(data, Object.keys(io.engine.clients), socket.id);
			});
		} else {
			var data = fs.readFileSync('./public/pen/xyz/index.html' ,'utf8');
			callback(data, Object.keys(io.engine.clients), socket.id);
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

	socket.on('disconnect', function() {
      console.log('Room: ' + socket.room + ' id: ' + socket.id + 'Got disconnect!');
      var i = socketlist.indexOf(socket);
      socketlist.splice(i, 1);
	  io.to(socket.room).emit('client-left', socket.id);
   });
});
