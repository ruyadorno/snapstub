#!/usr/bin/env node

'use strict';

const path = require('path');

const argv = require('minimist')(process.argv.slice(2));
const mockFolderName = process.env.SNAPSTUB_FOLDER_NAME || '__mocks__';
const port = process.env.SNAPSTUB_PORT || 8059;
const rootPath = path.join(process.cwd(), mockFolderName);
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
		mockFolderName: mockFolderName,
		port: port,
		rootPath: rootPath
	});
} else if (argv.version || argv.v) {
	commands.version();
} else {
	commands.help();
}

