const Engine = require('..');
const engine = new Engine();
const fs = require('fs');
const str = fs.readFileSync('test/fixtures/each.tmpl', 'utf8');

const a = { name: 'Halle', foo: 'bar' };

a.fn = engine.compile('a <%= this.name %> <%= this.foo %> b');
console.log(a.fn());

const fn = engine.compile('a <%= obj.a %> <%= this.b %> b');
console.log(fn({ a: 'Jon', b: 'S' }));

// engine.data('one', 'AAA');
// engine.data('two', 'BBB');

// const fn = engine.compile('a <%= this.one %> <%= this.two %> b');
// console.log(fn());

engine.data({ foo: 'bar' });
const each = (arr, fn) => arr.map(fn);
const res = engine.render(str, {
  each,
  list: ['a', 'b', 'c', 'd'],
  imports: {
    each,
    upper(str) {
      return str.toUpperCase();
    }
  }
});

console.log(engine);
