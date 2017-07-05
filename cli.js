#!/usr/bin/env node

'use strict';

const argv = require('minimist')(process.argv.slice(2));
const verbose = argv.verbose;
const mockFolderName = process.env.SNAPSTUB_FOLDER_NAME;
const port = process.env.SNAPSTUB_PORT;
const commandName = argv._[0];
const commands = require('./');

if (commandName in commands) {
	commands[commandName]({
		url: argv._[1],
		addOptions: argv,
		mockFolderName: mockFolderName,
		port: port,
		verbose: verbose
	});
} else if (argv.version || argv.v) {
	commands.version();
} else {
	commands.help();
}

