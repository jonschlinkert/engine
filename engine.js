/*!
 * engine <https://github.com/jonschlinkert/engine>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT License
 */

'use strict';

var es = require('event-stream');
var chalk = require('chalk');

/**
 * Initialize `Engine`
 *
 * ```js
 * var Engine = require('engine');
 * var engine = new Engine();
 * ```
 * @constructor
 * @api public
 */

function Engine() {
  if (!(this instanceof Engine)) {
    return new Engine();
  }
  this.stack = [];
}

/**
 * Add a plugin `fn` to the `plugins` stack.
 *
 * ```js
 * engine
 *   .use(foo({}))
 *   .use(bar({}))
 *   .use(baz({}))
 * ```
 *
 * **Params:**
 *
 * @param {Function} `fn` Add to the `plugins` stack.
 * @return {Object} `Engine` to enable chaining.
 * @api public
 */

Engine.prototype.use = function (fns) {
  arrayify(fns).forEach(function(fn) {
    if (typeof fn !== 'function' && !isStream(fn)) {
      var msg = 'plugin.use() expected a function:' + fn;
      throw new TypeError(chalk.bold(msg));
    }
    this.stack.push(fn);
  }.bind(this));
  return this;
};

/**
 * Call each function in the `plugins` stack to iterate over `arguments`.
 *
 * ```js
 * plugins.run( arguments )
 * ```
 *
 * @param {Array|Object|String} `arguments` The value to iterate over.
 * @api public
 */

Engine.prototype.run = function () {
  var args = [].slice.call(arguments);
  var cb = args[args.length - 1];
  var stack = this.stack;

  if (Array.isArray(args[1])) {
    stack = args[1];
    args.splice(1, 1);
  }

  var self = this;
  var i = 0, len = stack.length;

  function next(err, results) {
    if (err) {
      err.message = chalk.bold(err.message);
      throw new Error('plugin.run():', err);
    }

    args[0] = results;

    if(i < len) {
      stack[i++].apply(self, args.concat(next.bind(this)));
    } else {
      cb.apply(null, arguments);
    }
  }

  // async handling
  if (typeof cb === 'function') {
    args.pop();
    stack[i++].apply(self, args.concat(next.bind(this)));
  } else {
    var results = args.shift();
    for (i = 0; i < len; i++) {
      try {
        results = stack[i].apply(this, [results].concat(args));
      } catch (err) {
        err.message = chalk.bold(err.message);
        throw new Error('plugin.run():', err);
      }
    }
    return results;
  }
};

/**
 * Add each plugin to a pipeline to be used with
 * streams. Plugin must either be a stream or a
 * function that returns a stream.
 *
 * ```js
 * var pipeline = engine.pipeline( arguments )
 * ```
 *
 * @param {Array|Object|String} `arguments` The value to iterate over.
 * @api public
 */

Engine.prototype.pipeline = function() {
  var args = [].slice.call(arguments);
  var stack = this.stack;

  if (Array.isArray(args[0])) {
    stack = args[0];
    args.splice(0, 1);
  }

  var pipeline = [];
  var i = 0;
  var len = stack.length;
  for (i = 0; i < len; i++) {

    // when the plugin is a stream, add it to the pipeline
    if (isStream(stack[i])) {
      pipeline.push(stack[i]);
    } else {
      // otherwise, call the function and pass in the args
      // expect a stream to be returned to push onto the pipeline
      try {
        pipeline.push(stack[i].apply(this, args));
      } catch (err) {
        err.message = chalk.bold(err.message);
        throw new Error('plugin.pipeline():', err);
      }
    }
  }
  return es.pipe.apply(es, pipeline);
};

/**
 * Returns true if the object is a stream.
 *
 * @return {Boolean}
 */

function isStream (obj) {
  return typeof obj === 'object' && obj.on && typeof obj.on === 'function';
}

/**
 * Ensure that `val` is an array.
 *
 * @param  {String|Array} `val`
 */

function arrayify(val) {
  return !Array.isArray(val)
    ? [val]
    : val;
}

/**
 * Export `Engine`
 *
 * @type {Object}
 */

module.exports = Engine;



var engine = new Engine();

engine
  .use(function (str, next) {
    next(null, str + 'a');
  })
  .use(function (str, next) {
    next(null, str + 'b');
  })
  .use(function (str, next) {
    next(null, str + 'c');
  });

engine.run('alphabet-', function (err, str) {
  console.log(str); //=> 'alphabet-abc'
});
