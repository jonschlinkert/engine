'use strict';

var forIn = require('for-in');

/**
 * Expose `utils`
 */

var utils = module.exports;

utils.MAX_ARRAY_LENGTH = 4294967295;

/* Used to match HTML entities and HTML characters. */
utils.reEscapedHtml = /&(?:amp|lt|gt|quot|#39|#96);/g;
utils.reUnescapedHtml = /[&<>"'`]/g;
utils.reHasEscapedHtml = RegExp(utils.reEscapedHtml.source);
utils.reHasUnescapedHtml = RegExp(utils.reUnescapedHtml.source);

/* Used to match [ES template delimiters](http://ecma-international.org/ecma-262/6.0/#sec-template-literal-lexical-components). */
utils.reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

/* Used to match template delimiters. */
utils.reEscape = /<%-([\s\S]+?)%>/g;
utils.reEvaluate = /<%([\s\S]+?)%>/g;
utils.reInterpolate = /<%=([\s\S]+?)%>/g;

/* Used to ensure capturing order of template delimiters. */
utils.reNoMatch = /($^)/;
utils.reUnescapedString = /['\n\r\u2028\u2029\\]/g;
utils.reEmptyStringLeading = /\b__p \+= '';/g;
utils.reEmptyStringMiddle = /\b(__p \+=) '' \+/g;
utils.reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

/* Used to map characters to HTML entities. */
utils.htmlEscapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;'
};

/* Used to map HTML entities to characters. */
utils.htmlUnescapes = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#96;': '`'
};

/**
 * Used by `escape` to convert characters to HTML entities.
 *
 * @private
 * @param {string} chr The matched character to escape.
 * @returns {string} Returns the escaped character.
 */

utils.escapeHtmlChar = function escapeHtmlChar(chr) {
  return utils.htmlEscapes[chr];
};

/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 *
 * identity(object) === object;
 * // => true
 */

utils.identity = function identity(value) {
  return value;
};

utils.each = function each(obj, fn, thisArg) {
  if (Array.isArray(obj)) {
    return forEach(obj, fn, thisArg);
  } else {
    return forIn(obj, fn, thisArg);
  }
};

function forEach(arr, fn, thisArg) {
  if (arr == null) return;
  var len = arr.length, i = -1;
  while (++i < len) {
    if (fn.call(thisArg, arr[i], i, arr) === false) {
      break;
    }
  }
}

/**
 * Return a value wrapped in a function.
 *
 * @param  {*} val
 * @return {*}
 */

utils.constant = function constant(val) {
  return function() {
    return val;
  };
};

/**
 * Add a non-enumerable property to `receiver`
 *
 * @param  {Object} `obj`
 * @param  {String} `name`
 * @param  {Function} `val`
 */

utils.defineProp = function defineProp(receiver, key, value) {
  return Object.defineProperty(receiver, key, {
    configurable: true,
    enumerable: false,
    writable: true,
    value: value
  });
};

/**
 * Invokes the iteratee function `n` times, returning an array of the results
 * of each invocation. The iteratee is invoked with one argument; (index).
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} [iteratee=identity] The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 * @example
 *
 * var diceRolls = times(3, partial(random, 1, 6, false));
 * // => [3, 6, 4]
 *
 * times(3, function(n) {
 *   mage.castSpell(n);
 * });
 * // => invokes `mage.castSpell` three times with `n` of `0`, `1`, and `2`
 */

utils.times = function times(n, fn, thisArg) {
  n = Math.floor(n);

  // Exit early to avoid a JSC JIT bug in Safari 8
  // where `Array(0)` is treated as `Array(1)`.
  if (n < 1 || !isFinite(n)) {
    return [];
  }

  var index = -1;
  var result = Array(Math.min(n, utils.MAX_ARRAY_LENGTH));

  fn = utils.bindCallback(fn, thisArg, 1);
  while (++index < n) {
    if (index < utils.MAX_ARRAY_LENGTH) {
      result[index] = fn(index);
    } else {
      fn(index);
    }
  }
  return result;
};

/**
 * A specialized version of `baseCallback` which only supports `this` binding
 * and specifying the number of arguments to provide to `fn`.
 *
 * @private
 * @param {Function} `fn` The function to bind.
 * @param {*} thisArg The `this` binding of `fn`.
 * @param {number} [argCount] The number of arguments to provide to `fn`.
 * @returns {Function} Returns the callback.
 */

utils.bindCallback = function bindCallback(fn, thisArg, argCount) {
  if (typeof fn != 'function') {
    return utils.identity;
  }
  if (thisArg === undefined) {
    return fn;
  }
  switch (argCount) {
    case 1:
      return function(value) {
        return fn.call(thisArg, value);
      };
    case 3:
      return function(value, idx, collection) {
        return fn.call(thisArg, value, idx, collection);
      };
    case 4:
      return function(accumulator, value, idx, collection) {
        return fn.call(thisArg, accumulator, value, idx, collection);
      };
    case 5:
      return function(value, other, key, object, source) {
        return fn.call(thisArg, value, other, key, object, source);
      };
  }
  return function() {
    return fn.apply(thisArg, arguments);
  };
};

/**
 * Converts the characters "&", "<", ">", '"', "'", and "\`", in `string` to
 * their corresponding HTML entities.
 *
 * **Note:** No other characters are escaped. To escape additional characters
 * use a third-party library like [_he_](https://mths.be/he).
 *
 * Though the ">" character is escaped for symmetry, characters like
 * ">" and "/" don't need escaping in HTML and have no special meaning
 * unless they're part of a tag or unquoted attribute value.
 * See [Mathias Bynens's article](https://mathiasbynens.be/notes/ambiguous-ampersands)
 * (under "semi-related fun fact") for more details.
 *
 * Backticks are escaped because in Internet Explorer < 9, they can break out
 * of attribute values or HTML comments. See [#59](https://html5sec.org/#59),
 * [#102](https://html5sec.org/#102), [#108](https://html5sec.org/#108), and
 * [#133](https://html5sec.org/#133) of the [HTML5 Security Cheatsheet](https://html5sec.org/)
 * for more details.
 *
 * When working with HTML you should always [quote attribute values](http://wonko.com/post/html-escaping)
 * to reduce XSS vectors.
 *
 * @category String
 * @param {string} [string=''] The string to escape.
 * @returns {string} Returns the escaped string.
 * @example
 *
 * escape('foo, bar, & baz');
 * // => 'foo, bar, &amp; baz'
 */

utils.escape = function escape(str) {
  str = utils.baseToString(str);
  return (str && utils.reHasUnescapedHtml.test(str))
    ? str.replace(utils.reUnescapedHtml, utils.escapeHtmlChar)
    : str;
};

/**
 * Converts `value` to a string if it's not one. An empty string is returned
 * for `null` or `undefined` values.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */

utils.baseToString = function baseToString(value) {
  return value == null ? '' : (value + '');
};

utils.tryCatch = function tryCatch(fn) {
  try {
    return fn.call();
  } catch (err) {
    return err;
  }
};

utils.escapeStringChar = function escapeStringChar(ch) {
  return '\\' + ({
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  })[ch];
};
