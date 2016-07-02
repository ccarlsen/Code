var express = require('express');
var app = express();
var LEX = require('letsencrypt-express').testing();
var https = require('spdy');
var http = require('http');
var fs = require("fs");
var sass = require('node-sass');
var bodyParser = require('body-parser');
var mongo = require('./db');

var socketlist = [];
var socketinfolist = [];
var userlimit = 4;
var autosaveId;
var rootPath = './public/project/'
var templatePath = './template/'

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/public');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(function(req, res, next) {
  if(req.url.substr(-1) == '/' && req.url.length > 1) {
    res.redirect(301, req.url.slice(0, -1));
  } else {
    next();
  }
});

app.get('/new', function(req, res) {
  var newProjectId = generateRandomProjectName();
  console.log(newProjectId);
  mongo.projectExists(newProjectId, function(exists){
    if(!exists){
      console.log('creating new project');
      mongo.createNewProject(newProjectId, function(created){
        if(created){
          console.log('created!');
          res.redirect('/' + newProjectId);
        } else {
          res.redirect('/');
        }
      });
    } else {
      res.redirect('/');
    }
  });
});

app.get('/stats', function (req, res) {
  res.render("stats");
});

app.get('/:room', function(req, res) {
  var projectId = req.params.room;

  mongo.getProjectByName(projectId, function(project){
    if(project){
      if(getUserCountByProjectName(projectId) < userlimit){
        if(project.status == 1){
          res.render("project", { room: projectId });
        } else if(project.status == 0){
          res.render("private", { room: projectId });
        }
      } else {
        res.render("full");
      }
    } else {
      res.render("nothing");
    }
  });
});

app.get('/exists/:room', function (req, res) {
  var projectId = req.params.room;
	res.header("Content-Type", "application/json");
	res.header("Access-Control-Allow-Origin", "*");
	  mongo.getProjectByName(projectId, function(project){
      if(project){
        res.status(200).send(JSON.stringify({exists: true}));
      } else {
        res.status(200).send(JSON.stringify({exists: false}));
      }
	 });
});

app.post('/:room', function(req, res) {
  var pwd = req.body.pwd;
  var projectId = req.params.room;
  mongo.projectValid(projectId, pwd, function(valid){
    if(valid){
      if(getUserCountByProjectName(projectId) < userlimit){
          res.render("project", { room: projectId });
      } else {
        res.render("full");
      }
    } else {
      res.render("nothing");
    }
  });
});

app.post('/check/:room', function(req, res) {
  var pwd = req.body.pwd;
  var projectId = req.params.room;
  res.header("Content-Type", "application/json");
	res.header("Access-Control-Allow-Origin", "*");
  mongo.projectValid(projectId, pwd, function(valid){
    if(valid){
      res.status(200).send(JSON.stringify({valid: true}));
    } else {
      res.status(200).send(JSON.stringify({valid: false}));
    }
  });
});

app.get('/stats/info', function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
  res.header("Content-Type", "application/json");
  var respJson = '[{';
  for (var key in socketinfolist) {
      respJson += ',"' + key + '":' + JSON.stringify(socketinfolist[key]);
  }
  respJson += "}]";
  respJson = respJson.slice(0, 2) + respJson.slice(3);
  res.status(200).send(respJson);
});

//letsencrypt https config
var lex = LEX.create({
  configDir: '/etc/letsencrypt',
  approveRegistration: function (hostname, cb) {
    cb(null, {
      domains: ['puhn.co']
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
    mongo.getProjectByName(room, function(project){
      if(project){
        console.log('Client joins: ' + room);
        if(socketlist[room] == null){
          socketlist[room] = [];
        }
        if(socketinfolist[room] == null){
          socketinfolist[room] = [];
        }
        if(socketlist[room].length == userlimit){
          var data = {error: 'This room is full!'}
          callback(data, null, null);
        } else {
      		socket.join(room);
      		socket.room = room;
          socket.socketinfo = {};
          socket.socketinfo.room = room;
          socket.socketinfo.project = project;
          socket.socketinfo.clientid = socket.id;
          socket.socketinfo.activeTab = 'HTML';
          socket.socketinfo.usernumber = getNextUsernumber(socketlist[room]);
          socketlist[room].push(socket);
          socketinfolist[room].push(socket.socketinfo);
          var projectPath = rootPath + room;
      		console.log('Clients in Room: ' + room + ' - ' + socketlist[room].length);
      		if(socketlist[room].length > 1) {
              save(room, function(editorContent){
                callback(editorContent, socketinfolist[room], socket.socketinfo);
              });
      		} else {
            var fileContents = {};
            try {
                //Im user 1, get file conents
                fs.statSync(projectPath).isDirectory();
                fileContents.html = fs.readFileSync(projectPath + '/resource/html.content' ,'utf8');
                fileContents.css = fs.readFileSync(projectPath + '/resource/style.scss' ,'utf8');
                fileContents.js = fs.readFileSync(projectPath + '/full/script.js' ,'utf8');
                fileContents.jslinks = fs.readFileSync(projectPath + '/resource/js.links' ,'utf8');
                fileContents.csslinks = fs.readFileSync(projectPath + '/resource/css.links' ,'utf8');
                callback(fileContents, socketinfolist[room], socket.socketinfo);
            }
            catch (err) {
              //Make new project
              fs.mkdirSync(projectPath);
              fs.mkdirSync(projectPath + '/full');
              fs.mkdirSync(projectPath + '/resource');
              makeFullHtmlContent('<!-- HTML -->', projectPath, false, function(fullHtmlContent){
                fs.writeFileSync(projectPath + '/full/index.html', fullHtmlContent);
                fs.writeFileSync(projectPath + '/resource/html.content', '<!-- HTML -->');
                fs.writeFileSync(projectPath + '/resource/css.links', '');
                fs.writeFileSync(projectPath + '/resource/js.links', '');
                fs.writeFileSync(projectPath + '/resource/style.scss', '/* SCSS */');
                fs.writeFileSync(projectPath + '/full/style.css', '/* Compiled CSS */');
                fs.writeFileSync(projectPath + '/full/script.js', '// JavaScript');
                fileContents.html = '<!-- HTML -->';
                fileContents.css = '/* SCSS */';
                fileContents.js = '// JavaScript';
                fileContents.jslinks = '';
                fileContents.csslinks = '';
                callback(fileContents, socketinfolist[room], socket.socketinfo);
              });
            }
      		}
      		socket.broadcast.to(socket.room).emit('client-joined', socket.socketinfo);
        }
      } else {
        console.log('ERROR: Project not found..')
      }
    });

	});


	socket.on('change', function (data) {
		//console.log(data);
    clearTimeout(autosaveId);
    autosaveId = setTimeout(function() {
      save(socket.room, function(editorContent){
        io.to(socket.room).emit('autosave-receive', editorContent);
      });
    }, 2000);
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

  socket.on('switch-tab', function (editor) {
    var i = socketinfolist[socket.room].indexOf(socket.socketinfo);
    socket.socketinfo.activeTab = editor;
    socketinfolist[socket.room][i] = socket.socketinfo
		io.to(socket.room).emit('switch-tab-receive', socket.socketinfo);
	});

  socket.on('update-resource', function (data) {
    var projectPath = rootPath + socket.room;
    if(data.mode == 'CSS'){
      fs.writeFileSync(projectPath + '/resource/css.links', data.value);
    } else if(data.mode == 'JS'){
      fs.writeFileSync(projectPath + '/resource/js.links', data.value);
    }
    save(socket.room, function(editorContent){
      io.to(socket.room).emit('autosave-receive', editorContent);
    });
	});

  socket.on('send-message', function (data) {
    data.client  = socket.socketinfo;
		io.to(socket.room).emit('message-receive', data);
	});

  socket.on('set-private', function (pwd, callback) {
    console.log('Set private to: ' + pwd)
    mongo.setProjectStatus(socket.room, 0, pwd, function(saved){
      socket.broadcast.to(socket.room).emit('set-private-receive', pwd);
    });
	});

  socket.on('set-public', function (callback) {
    mongo.setProjectStatus(socket.room, 1, '', function(saved){
      socket.broadcast.to(socket.room).emit('set-public-receive');
    });
  });

	socket.on('disconnect', function() {
      console.log('Room: ' + socket.room + ' id: ' + socket.id + 'Got disconnect!');
      if(socket.room != null) {
        var i = socketlist[socket.room].indexOf(socket);
        var j = socketinfolist[socket.room].indexOf(socket.socketinfo);
        var tempSocketinfo = socket.socketinfo;
        socketlist[socket.room].splice(i, 1);
        socketinfolist[socket.room].splice(j, 1);
  	    io.to(socket.room).emit('client-left', tempSocketinfo);
      }
   });

   function save(room, callback){
     if(socketlist[room].length > 0){
     var ownersocket = socketlist[room][0];
     var projectPath = rootPath + room;
       ownersocket.emit('getValue', function(editorContent) {
         fs.writeFileSync(projectPath + '/resource/html.content', editorContent.html);
         fs.writeFileSync(projectPath + '/resource/style.scss', editorContent.css);
         fs.writeFileSync(projectPath + '/full/script.js', editorContent.js);
         editorContent.csslinks = fs.readFileSync(projectPath + '/resource/css.links' ,'utf8');
         editorContent.jslinks = fs.readFileSync(projectPath + '/resource/js.links' ,'utf8');

         //Compiled SCSS and then make full/html content
         sass.render({
           file: projectPath + '/resource/style.scss',
          }, function(err, result) {
            if(!err) {
              fs.writeFileSync(projectPath + '/full/style.css', result.css);
              io.to(socket.room).emit('sass-compile-error', null);
            } else {
              io.to(socket.room).emit('sass-compile-error', err.message + ' on line: ' + err.line);
            }
            makeFullHtmlContent(editorContent.html, projectPath, true, function(htmlContent){
              fs.writeFileSync(projectPath + '/full/index.html', htmlContent);
              callback(editorContent);
            });
         });
       });
     }
   }
});

function getNextUsernumber (socketlist){
  if(socketlist.length == 0){
    return 1;
  }
  for (i = 1; i <= userlimit; i++) {
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

function makeFullHtmlContent(body, projectPath, hasLinks, callback){
  var cssLinks = '';
  var jsLinks = '';
  if(hasLinks) {
    var cssLinks = fs.readFileSync(projectPath + '/resource/css.links' ,'utf8');
    var jsLinks = fs.readFileSync(projectPath + '/resource/js.links' ,'utf8');
  }
  var html = fs.readFileSync(templatePath + 'html.template' ,'utf8');
  html = html.replace('{{HTML}}', body);
  html = html.replace('{{CSS}}', cssLinks);
  html = html.replace('{{JS}}', jsLinks);
  callback(html);
}

function generateRandomProjectName() {
  return Math.round(100+(Math.random()*(999-100))) + '-' + Math.round(100+(Math.random()*(999-100))) + '-' + Math.round(100+(Math.random()*(999-100)));
}

function getUserCountByProjectName(projectId) {
  if(undefined == socketinfolist[projectId]) {
    return 0;
  }
  return socketinfolist[projectId].length;
}
