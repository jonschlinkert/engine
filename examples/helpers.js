// const Engine = require('..');
// const engine = new Engine();
// const helpers = require('template-helpers')._;

// engine.helpers(helpers);

// engine.data({ first: 'Brian' });
// const res = engine.render('<%= uppercase(first) %>');
// //=> 'BRIAN'
// console.log(res);

const lowercase = str => str.toLowerCase();
const uppercase = str => str.toUpperCase();
const titlecase = str => {
  return str.toLowerCase().replace(/(?=\b)(\w)/g, (m, $1) => $1.toUpperCase());
};

console.log(titlecase('foo-bar'));
