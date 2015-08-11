var Engine = require('..');
var engine = new Engine({regex: /:([-(\w.,|_ )]+)/g});

var res = engine.render('a/:foo/:upper(double(name, bar))/b/c/d/:baz/e', {
  foo: 'AAA',
  bar: 'BBB',
  baz: 'CCC',
  name: 'Brian',
  double: function (val1, val2) {
    return val1 + val1 + '-' + val2;
  },
  upper: function (val) {
    return val.toUpperCase();
  }
});

console.log(res);
