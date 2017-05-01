'use strict';

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
	/**
	 * pattern to match valid file names
	 * @example HTTP method: post.json
	 * @example middleware: post.js
	 */
	const patterns = methods.map(m => `**/${m}.+(json|js)`);

	globby(patterns, {cwd: srcPath})
		.then(paths => {
			const routes = paths.map(p => {
				// remove filename from path
				const directoryPath = p.substring(0, p.lastIndexOf('/'));
				return `http://localhost:${port}/${directoryPath}`;
			});
			for (let route of new Set(routes)) {
				out.info(route);
			}
		});
}

module.exports = startCmd;
