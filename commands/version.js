'use strict';

function versionCmd() {
	console.log(require('../package.json').version);
}

module.exports = versionCmd;

