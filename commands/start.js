'use strict';

const stubborn = require('stubborn-server');
const out = require('simple-output');

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
	} catch (e) {
		out.error('Failed to launch snapstub server');
	}
}

module.exports = startCmd;

