var pkg = require('../package.json'),
	version = pkg.version,
	name = pkg.name,
	join = require('path').join,
	path = join(__dirname, name, version, 'index.html'),
	osx = require('os').platform() === "darwin";

	if (osx) {
		console.log("opening this file in a web browser:\n", path);
		const exec = require('child_process').exec;
		const child = exec(`open '${path}'`, (error, stdout, stderr) => {
			if (stdout) console.log(`stdout: ${stdout}`);
			if (stderr) console.log(`stderr: ${stderr}`);
			if (error !== null) {
				console.log(`exec error: ${error}`);
			}
		});
		
		
	}
	else console.log("open this file in a web browser:\n", path);
	

