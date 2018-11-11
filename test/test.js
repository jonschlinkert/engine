'use strict';

require('mocha');
const assert = require('assert');
const support = require('./support');
const Engine = require('..');
let engine;

describe('engine', () => {
  beforeEach(function() {
    engine = new Engine();
    engine.helper('each', support.each);
  });;

  it('should escape values in "escape" delimiters', () => {
    let strings = ['<p><%- value %></p>', '<p><%-value%></p>', '<p><%-\nvalue\n%></p>'];
    let expected = strings.map(support.constant('<p>&amp;&lt;&gt;&quot;&#39;&#96;\/</p>'));

    let data = { 'value': '&<>"\'`\/' };
    let actual = strings.map(function(string) {
      return engine.render(string, data);
    });

    assert.deepEqual(actual, expected);
  });

  it('should evaluate JavaScript in "evaluate" delimiters', () => {
    let compiled = engine.compile(
      '<ul><% for(let key in collection) {'
    + '  %><li><%= collection[key] %></li><%'
    + '} %></ul>'
    );

    let data = { 'collection': { 'a': 'A', 'b': 'B' } },
        actual = compiled(data);

    assert.strictEqual(actual, '<ul><li>A</li><li>B</li></ul>');
  });

  it('should interpolate data object properties', () => {
    let strings = ['<%= a %>BC', '<%=a%>BC', '<%=\na\n%>BC'];
    let expected = strings.map(support.constant('ABC'));

    let actual = strings.map(function(string) {
      return engine.render(string, { 'a': 'A' });
    });

    assert.deepEqual(actual, expected);
  });

  it('should support escaped values in "interpolation" delimiters', () => {
    let compiled = engine.compile('<%= a ? "a=\\"A\\"" : "" %>');
    let data = { 'a': true };

    assert.strictEqual(compiled(data), 'a="A"');
  });

  it('should work with "interpolate" delimiters containing ternary operators', () => {
    let compiled = engine.compile('<%= value ? value : "b" %>');
    let data = { 'value': 'a' };

    assert.strictEqual(compiled(data), 'a');
  });

  it('should work with "interpolate" delimiters containing global values', () => {
    let compiled = engine.compile('<%= typeof Math.abs %>');
    let actual;
    try {
      actual = compiled();
    } catch (e) {}

    assert.strictEqual(actual, 'function');
  });

  it('should work with complex "interpolate" expressions:', () => {
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
      let compiled = engine.compile(key);
      let data = { 'a': 1, 'b': 2 };

      assert.strictEqual(compiled(data), value, key);
    });
  });

  it('should parse ES6 template delimiters', () => {
    let data = { 'value': 2 };
    assert.strictEqual(engine.compile('1${value}3')(data), '123');
    assert.strictEqual(engine.compile('${"{" + value + "\\}"}')(data), '{2}');
  });

  it('should not reference `escape` when "escape" delimiters are not used', () => {
    let compiled = engine.compile('<%= typeof __e %>');
    assert.strictEqual(compiled({}), 'undefined');
  });

  it('should allow referencing variables declared in "evaluate" delimiters from other delimiters', () => {
    let compiled = engine.compile('<% let b = a; %><%= b.value %>');
    let data = { 'a': { 'value': 1 } };

    assert.strictEqual(compiled(data), '1');
  });

  it('should support single line comments in "evaluate" delimiters (test production builds)', () => {
    let compiled = engine.compile('<% // A code comment. %><% if (value) { %>yap<% } else { %>nope<% } %>');
    let data = { 'value': true };

    assert.strictEqual(compiled(data), 'yap');
  });

  it('should work with custom delimiters', () => {
    support.times(5, function(index) {
      let settingsClone = Object.assign({}, engine.settings);

      let settings = Object.assign(index ? engine.settings : {}, {
        'escape': /\{\{-([\s\S]+?)\}\}/g,
        'evaluate': /\{\{([\s\S]+?)\}\}/g,
        'interpolate': /\{\{=([\s\S]+?)\}\}/g
      });

      let compiled = engine.compile('<ul>{{ each(collection, function(value, index) { }}<li>{{= index }}: {{- value }}</li>{{}); }}</ul>', index ? null : settings);
      let expected = '<ul><li>0: a &amp; A</li><li>1: b &amp; B</li></ul>';
      let data = { 'collection': ['a & A', 'b & B'] };

      assert.strictEqual(compiled(data), expected);
      Object.assign(engine.settings, settingsClone);
    });
  });

  it('should work with custom delimiters containing special characters', () => {
    support.times(5, function(index) {
      let settingsClone = Object.assign({}, engine.settings);

      let settings = Object.assign(index ? engine.settings : {}, {
        'escape': /<\?-([\s\S]+?)\?>/g,
        'evaluate': /<\?([\s\S]+?)\?>/g,
        'interpolate': /<\?=([\s\S]+?)\?>/g
      });

      let compiled = engine.compile('<ul><? each(collection, function(value, index) { ?><li><?= index ?>: <?- value ?></li><? }); ?></ul>', index ? null : settings),
          expected = '<ul><li>0: a &amp; A</li><li>1: b &amp; B</li></ul>';
      let data = { 'collection': ['a & A', 'b & B'] };

      assert.strictEqual(compiled(data), expected);
      Object.assign(engine.settings, settingsClone);
    });
  });

  it('should work with strings without delimiters', () => {
    let expected = 'abc';
    assert.strictEqual(engine.compile(expected)({}), expected);
  });

  it('should support the "imports" option', () => {
    let compiled = engine.compile('<%= a %>', { 'imports': { 'a': 1 } });
    assert.strictEqual(compiled({}), '1');
  });

  it('should support the "imports" option', () => {
    engine = new Engine({
      helpers: {
        foo: function() {},
        bar: function() {},
        baz: function() {}
      }
    })
    console.log(engine)
  });

  it('should support the "variable" options', () => {
    let compiled = engine.compile(
      '<% each(data.a, function(value) { %>' +
        '<%= value.valueOf() %>' +
      '<% }) %>', { 'variable': 'data' }
    );

    let data = { 'a': [1, 2, 3] };

    try {
      assert.strictEqual(compiled(data), '123');
    } catch (e) {
      assert(false, e.message);
    }
  });

  it('should support the legacy `options` param signature', () => {
    let compiled = engine.compile('<%= data.a %>', null, { 'variable': 'data' });
    let data = { 'a': 1 };

    assert.strictEqual(compiled(data), '1');
  });

  it('should use a `with` statement by default', () => {
    let compiled = engine.compile('<%= index %><%= collection[index] %><% each(collection, function(value, index) { %><%= index %><% }); %>'),
        actual = compiled({ 'index': 1, 'collection': ['a', 'b', 'c'] });

    assert.strictEqual(actual, '1b012');
  });

  it('should work with `this` references', () => {
    let compiled = engine.compile('a<%= this.String("b") %>c');
    assert.strictEqual(compiled(), 'abc');

    let object = { 'b': 'B' };
    object.compiled = engine.compile('A<%= this.b %>C', { 'variable': 'obj' });
    assert.strictEqual(object.compiled(), 'ABC');
  });

  it('should work with backslashes', () => {
    let compiled = engine.compile('<%= a %> \\b');
    let data = { 'a': 'A' };

    assert.strictEqual(compiled(data), 'A \\b');
  });

  it('should work with escaped characters in string literals', () => {
    let compiled = engine.compile('<% print("\'\\n\\r\\t\\u2028\\u2029\\\\") %>');
    assert.strictEqual(compiled(), "'\n\r\t\u2028\u2029\\");

    let data = { 'a': 'A' };
    compiled = engine.compile('\'\n\r\t<%= a %>\u2028\u2029\\"');
    assert.strictEqual(compiled(data), '\'\n\r\tA\u2028\u2029\\"');
  });

  it('should handle \\u2028 & \\u2029 characters', () => {
    let compiled = engine.compile('\u2028<%= "\\u2028\\u2029" %>\u2029');
    assert.strictEqual(compiled(), '\u2028\u2028\u2029\u2029');
  });

  it('should work with statements containing quotes', () => {
    let compiled = engine.compile("<%\
      if (a == 'A' || a == \"a\") {\
        %>'a',\"A\"<%\
      } %>"
    );

    let data = { 'a': 'A' };
    assert.strictEqual(compiled(data), "'a',\"A\"");
  });

  it('should work with templates containing newlines and comments', () => {
    let compiled = engine.compile(`<%
      // A code comment.
      if (value) { value += 3; }
      %><p><%= value %></p>`
    );
    assert.strictEqual(compiled({ 'value': 3 }), '<p>6</p>');
  });

  it('should not error with IE conditional comments enabled (test with development build)', () => {
    let compiled = engine.compile('');
    let pass = true;

    /*@cc_on @*/
    try {
      compiled();
    } catch (e) {
      pass = false;
    }
    assert(pass, true);
  });

  it('should tokenize delimiters', () => {
    let compiled = engine.compile('<span class="icon-<%= type %>2"></span>');
    let data = { 'type': 1 };
    assert.strictEqual(compiled(data), '<span class="icon-12"></span>');
  });

  it('should evaluate delimiters once', () => {
    let actual = [];
    let compiled = engine.compile('<%= fn("a") %><%- fn("b") %><% fn("c") %>');
    let data = { fn: function(value) { actual.push(value); } };

    compiled(data);
    assert.deepEqual(actual, ['a', 'b', 'c']);
  });

  it('should match delimiters before escaping text', () => {
    let compiled = engine.compile('<<\n a \n>>', { 'evaluate': /<<(.*?)>>/g });
    assert.strictEqual(compiled(), '<<\n a \n>>');
  });

  it('should resolve nullish values to an empty string', () => {
    let compiled = engine.compile('<%= a %><%- a %>');
    let data = { 'a': null };

    assert.strictEqual(compiled(data), '');

    data = { 'a': undefined };
    assert.strictEqual(compiled(data), '');

    data = { 'a': {} };
    compiled = engine.compile('<%= a.b %><%- a.b %>');
    assert.strictEqual(compiled(data), '');
  });

  it('should parse delimiters without newlines', () => {
    let expected = '<<\nprint("<p>" + (value ? "yes" : "no") + "</p>")\n>>';
    let compiled = engine.compile(expected, { 'evaluate': /<<(.+?)>>/g });
    let data = { 'value': true };

    assert.strictEqual(compiled(data), expected);
  });

  it('should support recursive calls', () => {
    let compiled = engine.compile('<%= a %><% a = engine.compile(c)(obj) %><%= a %>');
    let data = { 'a': 'A', 'b': 'B', 'c': '<%= b %>' };

    assert.strictEqual(compiled(data), 'AB');
  });

  it('should coerce `text` argument to a string', () => {
    let object = { 'toString': support.constant('<%= a %>') };
    let data = { 'a': 1 };

    assert.strictEqual(engine.compile(object)(data), '1');
  });

  it('should not augment the `options` object', () => {
    let options = {};
    engine.compile('', options);
    assert.deepEqual(options, {});
  });

  it('should not modify `engine.settings` when `options` are provided', () => {
    let data = { 'a': 1 };

    assert(!('a' in engine.settings));
    engine.compile('', {}, data);
    assert(!('a' in engine.settings));

    delete engine.settings.a;
  });

  it('should not error for non-object `data` and `options` values', () => {
    let pass = true;

    try {
      engine.compile('')(1);
    } catch (e) {
      pass = false;
    }

    assert(pass, '`data` value');
    pass = true;

    try {
      engine.compile('', 1)(1);
    } catch (e) {
      pass = false;
    }
    assert(pass, '`options` value');
  });

  it('should expose the source for compiled templates', () => {
    let compiled = engine.compile('x');
    let values = [String(compiled), compiled.source];

    values.forEach(function(value) {
      assert.equal(typeof value, 'string');
      assert.deepEqual(value.indexOf('__p') > -1, true);
    });
  });

  it('should expose the source when a SyntaxError occurs', () => {
    let source;
    try {
      engine.compile('<% if x %>');
    } catch (e) {
      source = e.source;
    }
    assert(source.indexOf('__p') > -1);
  });

  it('should not include sourceURLs in the source', () => {
    let options = { 'sourceURL': '/a/b/c' };
    let compiled = engine.compile('x', options);
    let values = [compiled.source, undefined];

    try {
      engine.compile('<% if x %>', options);
    } catch (e) {
      values[1] = e.source;
    }

    values.forEach(function(value) {
      assert.deepEqual(value.indexOf('sourceURL') > -1, false);
    });
  });

  it('should work as an iteratee for methods like `map`', () => {
    let array = ['<%= a %>', '<%- b %>', '<% print(c) %>'];

    let compiles = array.map(engine.compile.bind(engine));
    let data = { 'a': 'one', 'b': '`two`', 'c': 'three' };

    let actual = compiles.map(function(compiled) {
      return compiled(data);
    });

    assert.deepEqual(actual, ['one', '&#96;two&#96;', 'three']);
  });

  describe('delimiters', () => {
    afterEach(function() {
      Engine.utils.delimiters.lastIndex = 0;
    })

    it('should be `true` for `<%- foo %>`', () => {
      assert(Engine.utils.delimiters.test('<%- foo %>'));
    });

    it('should be `true` for `<%= foo %>`', () => {
      assert(Engine.utils.delimiters.test('<%= foo %>'));
    });

    it('should be `true` for `<% foo %>`', () => {
      assert(Engine.utils.delimiters.test('<% foo %>'));
    });

    it('should be `true` for `${foo}`', () => {
      assert(Engine.utils.delimiters.test('${foo}'));
    });

    it('should be `false` for `foo`', () => {
      assert(Engine.utils.delimiters.test('foo') === false);
    });
  });
});
