require('time-require');

var Engine = require('..');
var engine = new Engine();
var helpers = require('template-helpers')._;


engine.helpers(helpers);

engine.data({first: 'Brian'});
var res = engine.render('<%= uppercase(first) %>');
//=> 'BRIAN'
console.log(res);
