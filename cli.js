#!/usr/bin/env node

'use strict';

const getStdin = require('get-stdin');
const out = require('simple-output');

const argv = require('minimist')(process.argv.slice(2));
const verbose = argv.verbose;
const silent = argv.silent;
const mockFolderName = process.env.SNAPSTUB_FOLDER_NAME;
const port = process.env.SNAPSTUB_PORT;
const commandName = argv._[0];
const commands = require('./');

function executeCmd(stdin) {
	if (commandName in commands) {
		commands[commandName]({
			url: argv._[1],
			addOptions: argv,
			saveOptions: argv,
			mockFolderName: mockFolderName,
			port: port,
			verbose: verbose,
			silent: silent,
			stdin: stdin.trim()
		});
	} else if (argv.version || argv.v) {
		commands.version();
	} else {
		commands.help();
	}
}

getStdin()
	.then(executeCmd)
	.catch(() => {
		// Stdin is only required for save
		if (commandName === 'save') {
			out.error('Could not read from stdin');
			process.exit(1);
		} else {
			executeCmd();
		}
	});

