'use strict';

var forIn = require('for-in');

/**
 * Expose `support` methods
 */

var support = module.exports;

support.MAX_ARRAY_LENGTH = 4294967295;

/**
 * Return a value wrapped in a function.
 *
 * @param  {*} val
 * @return {*}
 */

support.constant = function constant(val) {
  return function() {
    return val;
  };
};

/**
 * This method returns the first argument provided to it.
 *
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 */

support.identity = function identity(value) {
  return value;
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

support.times = function times(n, fn, thisArg) {
  n = Math.floor(n);

  // Exit early to avoid a JSC JIT bug in Safari 8
  // where `Array(0)` is treated as `Array(1)`.
  if (n < 1 || !isFinite(n)) {
    return [];
  }

  var index = -1;
  var result = Array(Math.min(n, support.MAX_ARRAY_LENGTH));

  fn = support.bindCallback(fn, thisArg, 1);
  while (++index < n) {
    if (index < support.MAX_ARRAY_LENGTH) {
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

support.bindCallback = function bindCallback(fn, thisArg, argCount) {
  if (typeof fn !== 'function') {
    return support.identity;
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

support.each = function each(obj, fn, thisArg) {
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
