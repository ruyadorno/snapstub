'use strict';

const stubbornServer = require('stubborn-server');
const stubborn = stubbornServer();

module.exports = {
	add: require('./commands/add'),
	help: require('./commands/help'),
	save: require('./commands/save'),
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

