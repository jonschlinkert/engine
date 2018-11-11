const Engine = require('..');
const engine = new Engine({ regex: /:([-(\w.,|_ )]+)/g });
const res = engine.render('a/:foo/:upper(double(name, bar))/b/c/d/:baz/e', {
  foo: 'AAA',
  bar: 'BBB',
  baz: 'CCC',
  name: 'Brian',
  double(a, b) {
    return a + a + '-' + b;
  },
  upper(val) {
    return val.toUpperCase();
  }
});

console.log(res);
