const Engine = require('..');
const engine = new Engine();
const res = engine.render('<%= a.b.c(bar(name)) %>', {
  bar(val) {
    return 'Hello ' + val + '!';
  },
  name: 'Brian',
  a: {
    b: {
      c(fn) {
        return fn;
      }
    }
  }
});

console.log(res);
