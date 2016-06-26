var config = require('./config/cfg'),
    mongoose = require('mongoose'),
    bcrypt = require('bcryptjs');

//MongoDB Connection
mongoose.connect(config.mongodb.uri, function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log('Connected to MongoDB');
    }
});

//User Collection Schema
var projectSchema = mongoose.Schema({
  name: String,
  pwd: String,
  status: Number,
  created: {
    type: Date,
    default: Date.now
  }
});

var mongoProject = mongoose.model('Project', projectSchema);

exports.createNewProject = function(name, callback) {
    var newProject = new mongoProject({
        name: name,
        pwd: '',
        status: 1
    });
    //Save Project
    newProject.save(function (err, user) {
        if (err) return handleError(err);
        callback(true);
    });
}

exports.getProjectByName = function (name, callback) {
    mongoProject.findOne({
        name: name
    })
        .exec(function (err, project) {
            if (err) return handleError(err);
            callback(project);
        });
}

exports.projectExists = function (name, callback) {
  mongoProject.count({name: name}, function (err, count){
      if(count>0){
        callback(true);
      } else {
        callback(false);
      }
  });
}

exports.projectValid = function (name, pwd, callback) {
  mongoProject.count({name: name, pwd: pwd}, function (err, count){
      if(count>0){
        callback(true);
      } else {
        callback(false);
      }
  });
}

exports.setProjectStatus = function (name, status, pwd, callback) {
	mongoProject.findOne({ name: name }, function (err, project){
    project.status = status;
		project.pwd = pwd;
		project.save(function (err) {
			if (err) return handleError(err);
			callback(true);
		});
	});
}

function handleError(error) {
    console.log(error);
}
