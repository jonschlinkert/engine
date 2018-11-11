const Engine = require('..');
const engine = new Engine({ regex: /%([^%]+)%/g });
const res = engine.render('a/%foo%/%bar%/b/c/d/%baz%/e', {
  foo: 'AAA',
  bar: 'BBB',
  baz: 'CCC'
});

console.log(res);
