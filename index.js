#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const argv = require('minimist')(process.argv.slice(2));
const got = require('got');
const urlParse = require('url-parse-lax');
const mkdirp = require('mkdirp');
const out = require('simple-output');
const stubborn = require('stubborn-server');

const ROOT = path.join(process.cwd(), '__mocks__');
const commandName = argv._[0];
const commands = {
	add: () => {
		const url = argv._[1];
		const methodList = argv.method || 'get';
		const methods = methodList.split(',');
		const isJson = !argv.nojson;
		Promise.all(methods.map(name => got[name](url, {json: isJson})))
			.then(results => {
				const folderPath = path.join(ROOT, urlParse(url).pathname);
				mkdirp.sync(folderPath);
				methods.forEach((method, index) => {
					const fileExt = isJson ? '.json' : '';
					const fileName = path.join(folderPath, method.trim() + fileExt);
					fs.writeFileSync(fileName, JSON.stringify(results[index].body));
					out.success(`Successfully added: ${fileName}`);
				});
			})
			.catch(out.error);
	},
	start: () => {
		stubborn.start({
			logMode: 'all',
			namespace: '',
			pathToMocks: process.env.SNAPSTUB_FOLDER_NAME || '__mocks__',
			servePort: process.env.SNAPSTUB_PORT || 8059,
			fallbacks: []
		});
	}
};

if (commandName in commands) {
	commands[commandName]();
}

