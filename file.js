
module.exports = File;

function File(file) {
  file = file || {};

  this.cwd = file.cwd || process.cwd();
  this.base = file.base || this.cwd;
  this.stat = file.stat || null;
  this.contents = file.contents || null;
}

File.prototype.pipe = function(stream, opts) {
  opts = opts || {};

  // if (typeof opts.end === 'undefined') {
  //   opts.end = true;
  // }

  // if (this.isStream()) {
    return this.contents.pipe(stream, opts);
  // }

  // if (this.isBuffer()) {
  //   if (opts.end) {
  //     stream.end(this.contents);
  //   } else {
  //     stream.write(this.contents);
  //   }
  //   return stream;
  // }

  // if (opts.end) {
  //   stream.end();
  // }
  return stream;
};
