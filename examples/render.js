var Engine = require('..');
var engine = new Engine();

engine.data({first: 'Brian'});
var res = engine.render('<%= last %>, <%= first %>', {last: 'Woodward'});
//=> 'Woodward, Brian'
console.log(res);
