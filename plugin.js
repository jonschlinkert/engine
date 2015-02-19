function contents(opts) {
  return through.obj(function (file, enc, cb) {
    // don't fail to read a directory
    // if (file.isDirectory()) {
    //   return readDir(file, cb);
    // }
    console.log(file.toString())
    // read and pass full contents
    // if (opts.buffer !== false) {
    //   return bufferFile(file, cb);
    // }

    // dont buffer anything - just pass streams
    // return streamFile(file, cb);
    this.push(file);
  });
}
