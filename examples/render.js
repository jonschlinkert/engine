const Engine = require('..');
const engine = new Engine();

engine.data({ first: 'Brian' });
const res = engine.render('<%= last %>, <%= first %>', { last: 'Woodward' });
//=> 'Woodward, Brian'
console.log(res);
