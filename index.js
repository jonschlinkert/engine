/**
 * Copyright (c) 2012-present, The Dojo Foundation .<http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 * Copyright (c) 2015-present, Jon Schlinkert.
 */

'use strict';

const assign = require('assign-deep');
const utils = require('./utils');

/**
 * Create an instance of `Engine` with the given options.
 *
 * ```js
 * const Engine = require('engine');
 * const engine = new Engine();
 * ```
 * @param {Object} `options`
 * @api public
 */

class Engine {
  constructor(options = {}) {
    this.options = options;

    this.imports = this.options.imports || {};
    this.options.variable = '';
    this.settings = {};
    this.counter = 0;
    this.cache = {};

    // regex
    this.options.escape = this.options.escape || utils.reEscape;
    this.options.evaluate = this.options.evaluate || utils.reEvaluate;
    this.options.interpolate = this.options.interpolate || utils.reInterpolate;

    // register helpers
    if (this.options.helpers) {
      this.helpers(this.options.helpers);
    }
    // load data
    if (this.options.data) {
      this.data(this.options.data);
    }
  }

  /**
   * Register a template helper.
   *
   * ```js
   * engine.helper('upper', function(str) {
   *   return str.toUpperCase();
   * });
   *
   * engine.render('<%= upper(user) %>', {user: 'doowb'});
   * //=> 'DOOWB'
   * ```
   * @param  {String} `prop`
   * @param  {Function} `fn`
   * @return {Object} Instance of `Engine` for chaining
   * @api public
   */

  helper(prop, fn) {
    if (utils.isObject(prop)) {
      this.helpers(prop);
    } else {
      this.imports[prop] = fn;
    }
    return this;
  }

  /**
   * Register an object of template helpers.
   *
   * ```js
   * engine.helpers({
   *  upper: function(str) {
   *    return str.toUpperCase();
   *  },
   *  lower: function(str) {
   *    return str.toLowerCase();
   *  }
   * });
   *
   * // Or, just require in `template-helpers`
   * engine.helpers(require('template-helpers')._);
   * ```
   * @param  {Object|Array} `helpers` Object or array of helper objects.
   * @return {Object} Instance of `Engine` for chaining
   * @api public
   */

  helpers(helpers) {
    if (utils.isObject(helpers)) {
      for (let key of Object.keys(helpers)) {
        this.helper(key, helpers[key]);
      }
    }
    return this;
  }

  /**
   * Add data to be passed to templates as context.
   *
   * ```js
   * engine.data({first: 'Brian'});
   * engine.render('<%= last %>, <%= first %>', {last: 'Woodward'});
   * //=> 'Woodward, Brian'
   * ```
   * @param  {String|Object} `key` Property key, or an object
   * @param  {any} `value` If key is a string, this can be any typeof value
   * @return {Object} Engine instance, for chaining
   * @api public
   */

  data(prop, value) {
    if (typeof prop === 'object') {
      if (utils.isObject(prop)) {
        for (let key of Object.keys(prop)) {
          this.data(key, prop[key]);
        }
      }
    } else {
      if (!this.cache.data) this.cache.data = {};
      this.cache.data[prop] = value;
    }
    return this;
  }

  /**
   * Generate the regex to use for matching template variables.
   * @param  {Object} `opts`
   * @return {RegExp}
   */

  _regex(options) {
    let opts = Object.assign({}, this.options, options);
    if (!opts.interpolate && !opts.regex && !opts.escape && !opts.evaluate) {
      return utils.delimiters;
    }

    let interpolate = opts.interpolate || utils.reNoMatch;
    if (opts.regex instanceof RegExp) {
      interpolate = opts.regex;
    }

    let reString = (opts.escape || utils.reNoMatch).source
      + '|' + interpolate.source
      + '|' + (interpolate === utils.reInterpolate ? utils.reEsTemplate : utils.reNoMatch).source
      + '|' + (opts.evaluate || utils.reNoMatch).source;
    return new RegExp(reString + '|$', 'g');
  }

  /**
   * Creates a compiled template function that can interpolate data properties
   * in "interpolate" delimiters, HTML-escape interpolated data properties in
   * "escape" delimiters, and execute JavaScript in "evaluate" delimiters. Data
   * properties may be accessed as free variables in the template. If a setting
   * object is provided it takes precedence over `engine.settings` values.
   *
   * ```js
   * let fn = engine.compile('Hello, <%= user %>!');
   * //=> [function]
   *
   * fn({user: 'doowb'});
   * //=> 'Hello, doowb!'
   *
   * fn({user: 'halle'});
   * //=> 'Hello, halle!'
   * ```
   * @param {String} `str` The template string.
   * @param {Object} `options` The options object.
   * @param {RegExp} [options.escape] The HTML "escape" delimiter.
   * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
   * @param {Object} [options.imports] An object to import into the template as free variables.
   * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
   * @param {String} [options.sourceURL] The sourceURL of the template's compiled source.
   * @param {String} [options.variable] The data object variable name.
   * @param {Object} `settings` Engine settings
   * @returns {Function} Returns the compiled template function.
   * @api public
   */

  compile(input, options = {}, settings) {
    let engine = this;

    if (!(this instanceof Engine)) {
      if (!utils.isObject(options)) options = {};
      engine = new Engine(options);
    }

    let str = String(input);
    settings = assign({}, engine.settings, options && options.settings, settings);
    let opts = assign({}, engine.options, settings, options);

    let imports = assign({}, opts.imports, opts.helpers, settings.imports);
    imports.escape = utils.escape;
    assign(imports, utils.omit(engine.imports, 'engine'));
    assign(imports, utils.omit(engine.cache.data, 'engine'));
    imports.engine = engine;

    let keys = Object.keys(imports);
    let values = keys.map(key => imports[key]);
    let isEvaluating;
    let isEscaping;
    let source = "__p += '";
    let idx = 0;

    // Use a sourceURL for easier debugging.
    let sourceURL = '//# sourceURL='
      + ('sourceURL' in opts ? opts.sourceURL : (`engine.templateSources[${(++engine.counter)}]`))
      + '\n';

    // Compile the regexp to match each delimiter.
    let re = engine._regex(opts);

    str.replace(re, (match, esc, interp, es6, evaluate, offset) => {
      if (!interp) interp = es6;

      // Escape characters that can't be included in str literals.
      source += str.slice(idx, offset).replace(utils.reUnescapedString, utils.escapeStringChar);

      // Replace delimiters with snippets.
      if (esc) {
        isEscaping = true;
        source += `' +\n__e(${esc}) +\n'`;
      }
      if (evaluate) {
        isEvaluating = true;
        source += `';\n${evaluate};\n__p += '`;
      }
      if (interp) {
        source += `' +\n((__t = (${interp})) == null ? '' : __t) +\n'`;
      }

      idx = offset + match.length;

      // The JS engine embedded in Adobe products requires returning the `match`
      // str in order to produce the correct `offset` value.
      return match;
    });

    source += "';\n";

    // If `variable` is not specified wrap a with-statement around the generated
    // code to add the data object to the top of the scope chain.
    let variable = opts.variable;
    if (!variable) {
      source = `with (obj) {\n${source}\n}\n`;
    }

    // Cleanup code by stripping empty strings.
    source = (isEvaluating ? source.replace(utils.reEmptyStringLeading, '') : source)
      .replace(utils.reEmptyStringMiddle, '$1')
      .replace(utils.reEmptyStringTrailing, '$1;');

    // Frame code as the function body.
    source = 'function('
      + (variable || 'obj') + ') {\n'
      + (variable ? '' : '(obj || (obj = {}));\n')
      + 'let __t, __p = ""'
      + (isEscaping ? ', __e = escape' : '')
      + (isEvaluating ? ', __j = Array.prototype.join;\nfunction print() { __p += __j.call(arguments, "") }\n' : ';\n')
      + source + 'return __p\n}';

    let result = utils.tryCatch(function() {
      return Function(keys, sourceURL + `return ${source}`).apply(null, values);
    });

    // Provide the compiled function's source by its `toString` method or
    // the `source` property as a convenience for inlining compiled templates.
    result.source = source;

    if (result instanceof Error) {
      throw result;
    }

    return result;
  }

  /**
   * Renders templates with the given data and returns a string.
   *
   * ```js
   * engine.render('<%= user %>', {user: 'doowb'});
   * //=> 'doowb'
   * ```
   * @param  {String} `str`
   * @param  {Object} `data`
   * @return {String}
   * @api public
   */

  render(fn, locals, options) {
    let ctx = Object.assign({}, this.cache.data, locals);
    if (ctx.imports) ctx = Object.assign({}, ctx, ctx.imports);
    if (ctx.helpers) ctx = Object.assign({}, ctx, ctx.helpers);
    if (typeof fn === 'string') {
      fn = this.compile(fn, options);
    }
    return fn(ctx);
  }

  static get utils() {
    return utils;
  }
}

/**
 * Expose `Engine`
 */

module.exports = Engine;
