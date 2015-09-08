'use strict';

/**
 * Expose `utils`
 */

var lazy = module.exports = require('lazy-cache')(require);

lazy('set-value', 'set');
lazy('get-value', 'get');
lazy('kind-of', 'typeOf');
lazy('collection-visit', 'visit');
lazy('object.omit', 'omit');
lazy('assign-deep', 'assign');

var utils = lazy;

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
utils.delimiters = /<%-([\s\S]+?)%>|<%=([\s\S]+?)%>|\$\{([^\\}]*(?:\\.[^\\}]*)*)\}|<%([\s\S]+?)%>|$/g;

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
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 */

utils.identity = function identity(value) {
  return value;
};

/**
 * Converts the characters "&", "<", ">", '"', "'", and "\`", in `string` to
 * their corresponding HTML entities.
 *
 * @category String
 * @param {string} [string=''] The string to escape.
 * @returns {string} Returns the escaped string.
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
