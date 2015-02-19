var path = require('path');
var glob = require('glob');
var through = require('through2');
var readFiles = require('./');

function Engine() {
  this.tasks = {};
}

Engine.prototype.task = function(name, fn) {
  this.tasks[name] = fn;
};

Engine.prototype.src = function(pattern, cb) {
  readFiles(pattern, cb);
};


var engine = new Engine();

engine.src('.verb.md', function (err, file) {
  file
    .pipe(one())
    .pipe(two())
});


function one(opts) {
  return through.obj(function (file, enc, cb) {
    console.log(file.toString())
    this.push(file);
  });
}


function two(opts) {
  return through.obj(function (file, enc, cb) {
    console.log('two')
    this.push(file);
  });
}

