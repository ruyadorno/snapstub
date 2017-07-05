'use strict';

const stubborn = require('stubborn-server');

module.exports = {
	add: require('./commands/add'),
	help: require('./commands/help'),
	start: opts => {
		// defines a default stubborn server value
		const options = Object.assign({
			stubborn: stubborn
		}, opts);
		// execs the start command
		require('./commands/start')(options);
		return stubborn;
	},
	stop: () => {
		stubborn.stop();
		return stubborn;
	},
	version: require('./commands/version')
};

