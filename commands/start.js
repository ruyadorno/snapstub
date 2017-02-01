'use strict';

const stubborn = require('stubborn-server');

function startCmd() {
	stubborn.start({
		logMode: 'all',
		namespace: '',
		pathToMocks: process.env.SNAPSTUB_FOLDER_NAME || '__mocks__',
		servePort: process.env.SNAPSTUB_PORT || 8059,
		fallbacks: []
	});
}

module.exports = startCmd;

