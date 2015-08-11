var red = require('ansi-red');
var Engine = require('..');
var engine = new Engine({regex: /\{{(.*?)}}/g, fn: function(val) {

}});

var res = engine.render('a/{{ name | upper | red | log }}/b', {
  foo: 'AAA',
  bar: 'BBB',
  baz: 'CCC',
  name: 'Brian',
  double: function (val1, val2) {
    return val1 + val1 + '-' + val2;
  },
  upper: function (val) {
    return val.toUpperCase();
  },
  red: red,
  log: console.log.bind(console)
});

console.log(res);

