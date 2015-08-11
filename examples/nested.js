var Engine = require('..');
var engine = new Engine();

var res = engine.render('<%= a.b.c(bar(name)) %>', {
  bar: function (val) {
    return 'Hello ' + val + '!';
  },
  name: 'Brian',
  a: {
    b: {
      c: function (fn) {
        return fn
      }
    }
  }
})

console.log(res);
