#!/usr/bin/env node

'use strict';

const out = require('simple-output');

const argv = require('minimist')(process.argv.slice(2));
const {debug, silent, verbose} = argv;
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
			mockFolderName,
			port,
			verbose,
			silent,
			stdin: stdin.trim(),
		});
	} else if (argv.version || argv.v) {
		commands.version();
	} else {
		commands.help();
	}
}

import('get-stdin')
	.then(({default: getStdin}) => getStdin())
	.then(executeCmd)
	.catch(e => {
		if (debug) {
			console.error(e);
			process.exit(1);
		// Stdin is only required for save
		} else if (commandName === 'save') {
			out.error('Could not read from stdin');
			process.exit(1);
		} else {
			executeCmd();
		}
	});

