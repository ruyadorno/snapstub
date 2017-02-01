#!/usr/bin/env node

'use strict';

const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

const ROOT = path.join(process.cwd(), '__mocks__');
const commandName = argv._[0];
const commands = {
	add: require('./commands/add'),
	help: require('./commands/help'),
	start: require('./commands/start'),
	version: require('./commands/version')
};

if (commandName in commands) {
	commands[commandName]({
		argv: argv,
		rootPath: ROOT
	});
} else if (argv.version || argv.v) {
	commands.version();
} else {
	commands.help();
}

