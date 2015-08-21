'use strict';

/* deps: mocha */
var assert = require('assert');
var should = require('should');
var extend = require('extend-shallow');
var clone = require('shallow-clone')
var support = require('./support');
var Engine = require('..');
var _ = require('lodash');
var engine;

describe('engine', function() {
  beforeEach(function() {
    engine = new Engine();
    engine.helper('each', support.each);
  });;

  it('should escape values in "escape" delimiters', function() {
    var strings = ['<p><%- value %></p>', '<p><%-value%></p>', '<p><%-\nvalue\n%></p>'];
    var expected = strings.map(support.constant('<p>&amp;&lt;&gt;&quot;&#39;&#96;\/</p>'));

    var data = { 'value': '&<>"\'`\/' };
    var actual = strings.map(function(string) {
      return engine.render(string, data);
    });

    assert.deepEqual(actual, expected);
  });

  it('should evaluate JavaScript in "evaluate" delimiters', function() {
    var compiled = engine.compile(
      '<ul><% for(var key in collection) {'
    + '  %><li><%= collection[key] %></li><%'
    + '} %></ul>'
    );

    var data = { 'collection': { 'a': 'A', 'b': 'B' } },
        actual = compiled(data);

    assert.strictEqual(actual, '<ul><li>A</li><li>B</li></ul>');
  });

  it('should interpolate data object properties', function() {
    var strings = ['<%= a %>BC', '<%=a%>BC', '<%=\na\n%>BC'];
    var expected = strings.map(support.constant('ABC'));

    var actual = strings.map(function(string) {
      return engine.render(string, { 'a': 'A' });
    });

    assert.deepEqual(actual, expected);
  });

  it('should support escaped values in "interpolation" delimiters', function() {
    var compiled = engine.compile('<%= a ? "a=\\"A\\"" : "" %>');
    var data = { 'a': true };

    assert.strictEqual(compiled(data), 'a="A"');
  });

  it('should work with "interpolate" delimiters containing ternary operators', function() {
    var compiled = engine.compile('<%= value ? value : "b" %>');
    var data = { 'value': 'a' };

    assert.strictEqual(compiled(data), 'a');
  });

  it('should work with "interpolate" delimiters containing global values', function() {
    var compiled = engine.compile('<%= typeof Math.abs %>');
    var actual;
    try {
      actual = compiled();
    } catch(e) {}

    assert.strictEqual(actual, 'function');
  });

  it('should work with complex "interpolate" expressions:', function() {
    support.each({
      '<%= a + b %>': '3',
      '<%= b - a %>': '1',
      '<%= a = b %>': '2',
      '<%= !a %>': 'false',
      '<%= ~a %>': '-2',
      '<%= a * b %>': '2',
      '<%= a / b %>': '0.5',
      '<%= a % b %>': '1',
      '<%= a >> b %>': '0',
      '<%= a << b %>': '4',
      '<%= a & b %>': '0',
      '<%= a ^ b %>': '3',
      '<%= a | b %>': '3',
      '<%= {}.toString.call(0) %>': '[object Number]',
      '<%= a.toFixed(2) %>': '1.00',
      '<%= obj.a %>': '1',
      '<%= obj["a"] %>': '1',
      '<%= delete a %>': 'true',
      '<%= "a" in obj %>': 'true',
      '<%= obj instanceof Object %>': 'true',
      '<%= new Boolean %>': 'false',
      '<%= typeof a %>': 'number',
      '<%= void a %>': ''
    }, function(value, key) {
      var compiled = engine.compile(key);
      var data = { 'a': 1, 'b': 2 };

      assert.strictEqual(compiled(data), value, key);
    });
  });

  it('should parse ES6 template delimiters', function() {
    var data = { 'value': 2 };
    assert.strictEqual(engine.compile('1${value}3')(data), '123');
    assert.strictEqual(engine.compile('${"{" + value + "\\}"}')(data), '{2}');
  });

  it('should not reference `escape` when "escape" delimiters are not used', function() {
    var compiled = engine.compile('<%= typeof __e %>');
    assert.strictEqual(compiled({}), 'undefined');
  });

  it('should allow referencing variables declared in "evaluate" delimiters from other delimiters', function() {
    var compiled = engine.compile('<% var b = a; %><%= b.value %>');
    var data = { 'a': { 'value': 1 } };

    assert.strictEqual(compiled(data), '1');
  });

  it('should support single line comments in "evaluate" delimiters (test production builds)', function() {
    var compiled = engine.compile('<% // A code comment. %><% if (value) { %>yap<% } else { %>nope<% } %>');
    var data = { 'value': true };

    assert.strictEqual(compiled(data), 'yap');
  });

  it('should work with custom delimiters', function() {
    support.times(5, function(index) {
      var settingsClone = clone(engine.settings);

      var settings = extend(index ? engine.settings : {}, {
        'escape': /\{\{-([\s\S]+?)\}\}/g,
        'evaluate': /\{\{([\s\S]+?)\}\}/g,
        'interpolate': /\{\{=([\s\S]+?)\}\}/g
      });

      var compiled = engine.compile('<ul>{{ each(collection, function(value, index){ }}<li>{{= index }}: {{- value }}</li>{{}); }}</ul>', index ? null : settings);
      var expected = '<ul><li>0: a &amp; A</li><li>1: b &amp; B</li></ul>';
      var data = { 'collection': ['a & A', 'b & B'] };

      assert.strictEqual(compiled(data), expected);
      extend(engine.settings, settingsClone);
    });
  });

  it('should work with custom delimiters containing special characters', function() {
    support.times(5, function(index) {
      var settingsClone = clone(engine.settings);

      var settings = extend(index ? engine.settings : {}, {
        'escape': /<\?-([\s\S]+?)\?>/g,
        'evaluate': /<\?([\s\S]+?)\?>/g,
        'interpolate': /<\?=([\s\S]+?)\?>/g
      });

      var compiled = engine.compile('<ul><? each(collection, function(value, index) { ?><li><?= index ?>: <?- value ?></li><? }); ?></ul>', index ? null : settings),
          expected = '<ul><li>0: a &amp; A</li><li>1: b &amp; B</li></ul>';
      var data = { 'collection': ['a & A', 'b & B'] };

      assert.strictEqual(compiled(data), expected);
      extend(engine.settings, settingsClone);
    });
  });

  it('should work with strings without delimiters', function() {
    var expected = 'abc';
    assert.strictEqual(engine.compile(expected)({}), expected);
  });

  it('should support the "imports" option', function() {
    var compiled = engine.compile('<%= a %>', { 'imports': { 'a': 1 } });
    assert.strictEqual(compiled({}), '1');
  });

  it('should support the "imports" option', function() {
    engine = new Engine({
      helpers: {
        foo: function () {},
        bar: function () {},
        baz: function () {}
      }
    })
    console.log(engine)
  });

  it('should support the "variable" options', function() {
    var compiled = engine.compile(
      '<% each(data.a, function(value) { %>' +
        '<%= value.valueOf() %>' +
      '<% }) %>', { 'variable': 'data' }
    );

    var data = { 'a': [1, 2, 3] };

    try {
      assert.strictEqual(compiled(data), '123');
    } catch(e) {
      assert(false, e.message);
    }
  });

  it('should support the legacy `options` param signature', function() {
    var compiled = engine.compile('<%= data.a %>', null, { 'variable': 'data' });
    var data = { 'a': 1 };

    assert.strictEqual(compiled(data), '1');
  });

  it('should use a `with` statement by default', function() {
    var compiled = engine.compile('<%= index %><%= collection[index] %><% each(collection, function(value, index) { %><%= index %><% }); %>'),
        actual = compiled({ 'index': 1, 'collection': ['a', 'b', 'c'] });

    assert.strictEqual(actual, '1b012');
  });

  it('should work with `this` references', function() {
    var compiled = engine.compile('a<%= this.String("b") %>c');
    assert.strictEqual(compiled(), 'abc');

    var object = { 'b': 'B' };
    object.compiled = engine.compile('A<%= this.b %>C', { 'variable': 'obj' });
    assert.strictEqual(object.compiled(), 'ABC');
  });

  it('should work with backslashes', function() {
    var compiled = engine.compile('<%= a %> \\b');
    var data = { 'a': 'A' };

    assert.strictEqual(compiled(data), 'A \\b');
  });

  it('should work with escaped characters in string literals', function() {
    var compiled = engine.compile('<% print("\'\\n\\r\\t\\u2028\\u2029\\\\") %>');
    assert.strictEqual(compiled(), "'\n\r\t\u2028\u2029\\");

    var data = { 'a': 'A' };
    compiled = engine.compile('\'\n\r\t<%= a %>\u2028\u2029\\"');
    assert.strictEqual(compiled(data), '\'\n\r\tA\u2028\u2029\\"');
  });

  it('should handle \\u2028 & \\u2029 characters', function() {
    var compiled = engine.compile('\u2028<%= "\\u2028\\u2029" %>\u2029');
    assert.strictEqual(compiled(), '\u2028\u2028\u2029\u2029');
  });

  it('should work with statements containing quotes', function() {
    var compiled = engine.compile("<%\
      if (a == 'A' || a == \"a\") {\
        %>'a',\"A\"<%\
      } %>"
    );

    var data = { 'a': 'A' };
    assert.strictEqual(compiled(data), "'a',\"A\"");
  });

  it('should work with templates containing newlines and comments', function() {
    var compiled = engine.compile('<%\n\
      // A code comment.\n\
      if (value) { value += 3; }\n\
      %><p><%= value %></p>'
    );
    assert.strictEqual(compiled({ 'value': 3 }), '<p>6</p>');
  });

  it('should not error with IE conditional comments enabled (test with development build)', function() {
    var compiled = engine.compile('');
    var pass = true;

    /*@cc_on @*/
    try {
      compiled();
    } catch(e) {
      pass = false;
    }
    assert(pass, true);
  });

  it('should tokenize delimiters', function() {
    var compiled = engine.compile('<span class="icon-<%= type %>2"></span>');
    var data = { 'type': 1 };
    assert.strictEqual(compiled(data), '<span class="icon-12"></span>');
  });

  it('should evaluate delimiters once', function() {
    var actual = [];
    var compiled = engine.compile('<%= fn("a") %><%- fn("b") %><% fn("c") %>');
    var data = { fn: function(value) { actual.push(value); } };

    compiled(data);
    assert.deepEqual(actual, ['a', 'b', 'c']);
  });

  it('should match delimiters before escaping text', function() {
    var compiled = engine.compile('<<\n a \n>>', { 'evaluate': /<<(.*?)>>/g });
    assert.strictEqual(compiled(), '<<\n a \n>>');
  });

  it('should resolve nullish values to an empty string', function() {
    var compiled = engine.compile('<%= a %><%- a %>');
    var data = { 'a': null };

    assert.strictEqual(compiled(data), '');

    data = { 'a': undefined };
    assert.strictEqual(compiled(data), '');

    data = { 'a': {} };
    compiled = engine.compile('<%= a.b %><%- a.b %>');
    assert.strictEqual(compiled(data), '');
  });

  it('should parse delimiters without newlines', function() {
    var expected = '<<\nprint("<p>" + (value ? "yes" : "no") + "</p>")\n>>';
    var compiled = engine.compile(expected, { 'evaluate': /<<(.+?)>>/g });
    var data = { 'value': true };

    assert.strictEqual(compiled(data), expected);
  });

  it('should support recursive calls', function() {
    var compiled = engine.compile('<%= a %><% a = engine.compile(c)(obj) %><%= a %>');
    var data = { 'a': 'A', 'b': 'B', 'c': '<%= b %>' };

    assert.strictEqual(compiled(data), 'AB');
  });

  it('should coerce `text` argument to a string', function() {
    var object = { 'toString': support.constant('<%= a %>') };
    var data = { 'a': 1 };

    assert.strictEqual(engine.compile(object)(data), '1');
  });

  it('should not augment the `options` object', function() {
    var options = {};
    engine.compile('', options);
    assert.deepEqual(options, {});
  });

  it('should not modify `engine.settings` when `options` are provided', function() {
    var data = { 'a': 1 };

    assert(!('a' in engine.settings));
    engine.compile('', {}, data);
    assert(!('a' in engine.settings));

    delete engine.settings.a;
  });

  it('should not error for non-object `data` and `options` values', function() {
    var pass = true;

    try {
      engine.compile('')(1);
    } catch(e) {
      pass = false;
    }

    assert(pass, '`data` value');
    pass = true;

    try {
      engine.compile('', 1)(1);
    } catch(e) {
      pass = false;
    }
    assert(pass, '`options` value');
  });

  it('should expose the source for compiled templates', function() {
    var compiled = engine.compile('x');
    var values = [String(compiled), compiled.source];

    values.forEach(function(value) {
      assert.equal(typeof value, 'string');
      assert.deepEqual(value.indexOf('__p') > -1, true);
    });
  });

  it('should expose the source when a SyntaxError occurs', function() {
    var source;
    try {
      engine.compile('<% if x %>');
    } catch(e) {
      source = e.source;
    }
    assert(source.indexOf('__p') > -1);
  });

  it('should not include sourceURLs in the source', function() {
    var options = { 'sourceURL': '/a/b/c' };
    var compiled = engine.compile('x', options);
    var values = [compiled.source, undefined];

    try {
      engine.compile('<% if x %>', options);
    } catch(e) {
      values[1] = e.source;
    }

    values.forEach(function(value) {
      assert.deepEqual(value.indexOf('sourceURL') > -1, false);
    });
  });

  it('should work as an iteratee for methods like `map`', function() {
    var array = ['<%= a %>', '<%- b %>', '<% print(c) %>'];

    var compiles = array.map(engine.compile.bind(engine));
    var data = { 'a': 'one', 'b': '`two`', 'c': 'three' };

    var actual = compiles.map(function(compiled) {
      return compiled(data);
    });

    assert.deepEqual(actual, ['one', '&#96;two&#96;', 'three']);
  });
});
