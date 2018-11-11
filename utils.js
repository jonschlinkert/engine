'use strict';

const toString = Object.prototype.toString;

/* Used to match HTML entities and HTML characters. */
exports.reEscapedHtml = /&(?:amp|lt|gt|quot|#39|#96);/g;
exports.reUnescapedHtml = /[&<>"'`]/g;
exports.reHasEscapedHtml = new RegExp(exports.reEscapedHtml.source);
exports.reHasUnescapedHtml = new RegExp(exports.reUnescapedHtml.source);

/* Used to match [ES template delimiters](http://ecma-international.org/ecma-262/6.0/#sec-template-literal-lexical-components). */
exports.reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

/* Used to match template delimiters. */
exports.reEscape = /<%-([\s\S]+?)%>/g;
exports.reEvaluate = /<%([\s\S]+?)%>/g;
exports.reInterpolate = /<%=([\s\S]+?)%>/g;
exports.delimiters = /<%-([\s\S]+?)%>|<%=([\s\S]+?)%>|\$\{([^\\}]*(?:\\.[^\\}]*)*)\}|<%([\s\S]+?)%>$/g;

/* Used to ensure capturing order of template delimiters. */
exports.reNoMatch = /($^)/;
exports.reUnescapedString = /['\n\r\u2028\u2029\\]/g;
exports.reEmptyStringLeading = /\b__p \+= '';/g;
exports.reEmptyStringMiddle = /\b(__p \+=) '' \+/g;
exports.reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

/* Used to map characters to HTML entities. */
exports.htmlEscapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;'
};

/* Used to map HTML entities to characters. */
exports.htmlUnescapes = {
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

exports.escapeHtmlChar = ch => exports.htmlEscapes[ch] || ch;

/**
 * Returns true if `val` is an object.
 */

exports.isObject = val => {
  return typeof val === 'function' || (val && typeof val === 'object' && !Array.isArray(val));
};

/**
 * Converts the characters "&", "<", ">", '"', "'", and "\`", in `string` to
 * their corresponding HTML entities.
 *
 * @category String
 * @param {string} [string=''] The string to escape.
 * @returns {string} Returns the escaped string.
 */

exports.escape = input => {
  let str = exports.baseToString(input);
  return (str && exports.reHasUnescapedHtml.test(str))
    ? str.replace(exports.reUnescapedHtml, exports.escapeHtmlChar)
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

exports.baseToString = value => value ? value + '' : '';

exports.tryCatch = fn => {
  try {
    return fn();
  } catch (err) {
    return err;
  }
};

exports.escapeStringChar = ch => {
  return '\\' + ({
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  })[ch];
};

exports.omit = (obj, keys) => {
  let res = {};
  if (!obj) return res;
  keys = [].concat(keys || []);
  for (let key of Object.keys(obj)) {
    if (!keys.includes(key)) {
      res[key] = obj[key];
    }
  }
  return res;
};
