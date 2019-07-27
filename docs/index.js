const open = require('open');

var pkg = require('../package.json'),
	join = require('path').join,
	path = join(__dirname, pkg.name, pkg.version, 'index.html');


open(path).then(() => console.log(`open file : "${path}"`)).catch(err => console.error(`Cannot open file "${path}" : ${err}`));
