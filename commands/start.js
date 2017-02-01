'use strict';

const stubborn = require('stubborn-server');

function startCmd(opts) {
	const mockFolderName = opts.mockFolderName;
	const port = opts.port;
	stubborn.start({
		logMode: 'all',
		namespace: '',
		pathToMocks: mockFolderName,
		servePort: port,
		fallbacks: []
	});
}

module.exports = startCmd;

