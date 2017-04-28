'use strict';

const fs = require('fs');
const path = require('path');
const stubborn = require('stubborn-server');
const out = require('simple-output');
const globby = require('globby');
const methods = require('methods');

function startCmd(opts) {
	const mockFolderName = opts.mockFolderName;
	const port = opts.port;
	try {
		stubborn.start({
			logMode: opts.verbose ? 'all' : 'warn',
			namespace: '',
			pathToMocks: mockFolderName,
			servePort: port,
			fallbacks: []
		});
		out.success('Successfully launched snapstub server on: ' +
			'http://localhost:' + port);
		printRoutes(mockFolderName, port);
	} catch (e) {
		out.error('Failed to launch snapstub server');
	}
}
function printRoutes(srcPath, port) {
	globby('**/', {cwd: srcPath})
		.then(paths => {
			paths.forEach(pathName => {
				if (methods.some(method => {
					const fileLocation = path.join(srcPath, pathName, method);
					return [
						`${fileLocation}.js`,
						`${fileLocation}.json`
					].some(fileName => {
						try {
							fs.accessSync(fileName, fs.constants.R_OK);
							return true;
						} catch (err) {
							return false;
						}
					});
				})) {
					out.info(`http://localhost:${port}/${pathName}`);
				}
			});
		})
		.catch(out.error);
}

module.exports = startCmd;
