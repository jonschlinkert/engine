var Engine = require('..');
var engine = new Engine({regex: /%([^%]+)%/g});

var res = engine.render('a/%foo%/%bar%/b/c/d/%baz%/e', {
  foo: 'AAA',
  bar: 'BBB',
  baz: 'CCC',
})

console.log(res);
