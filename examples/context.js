var Engine = require('..');
var engine = new Engine();

var fs = require('fs');
var str = fs.readFileSync('test/fixtures/each.tmpl', 'utf8');

var a = {name: 'Halle', foo: 'bar'};

a.fn = engine.compile('a <%= this.name %> <%= this.foo %> b');
console.log(a.fn());

var fn = engine.compile('a <%= obj.a %> <%= this.b %> b');
console.log(fn({a: 'Jon', b: 'S'}));


// engine.data('one', 'AAA');
// engine.data('two', 'BBB');

// var fn = engine.compile('a <%= this.one %> <%= this.two %> b');
// console.log(fn());

function each(arr, fn) {
  var res = [];
  arr.forEach(function (val) {
    res.push(fn(val));
  });
  return res;
}

engine.data({foo: 'bar'})

var res = engine.render(str, {
  each: each,
  list: ['a', 'b', 'c', 'd'],
  imports: {
    each: each,
    upper: function(str) {
      return str.toUpperCase();
    }
  }
});

console.log(engine);
