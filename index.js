/*!
 * engine <https://github.com/jonschlinkert/engine>
 *
 * Copyright (c) 2015 Jon Schlinkert.
 * Licensed under the MIT license.
 */

'use strict';

var File = require('./file');
var fs = require('fs');

module.exports = function (fp, cb) {
  var file = new File({path: fp});
  file.contents = fs.createReadStream(fp);
  cb(null, file);
};
