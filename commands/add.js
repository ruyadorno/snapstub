'use strict';

const fs = require('fs');
const path = require('path');

const jsonlint = require('jsonlint/lib/formatter');
const mkdirp = require('mkdirp');
const got = require('got');
const urlParse = require('url-parse-lax');
const out = require('simple-output');

function addCmd(opts) {
	const argv = opts.argv;
	const rootPath = opts.rootPath;
	const url = argv._[1];
	const methodList = argv.method || 'get';
	const methods = methodList.split(',');
	const isJson = !argv.nojson;
	Promise.all(methods.map(name => got[name](url, {json: isJson})))
		.then(results => {
			const folderPath = path.join(rootPath, urlParse(url).pathname);
			mkdirp.sync(folderPath);
			methods.forEach((method, index) => {
				const fileExt = isJson ? '.json' : '';
				const fileName = path.join(folderPath, method.trim() + fileExt);
				fs.writeFileSync(fileName, jsonlint.formatter.formatJson(JSON.stringify(results[index].body)));
				out.success(`Successfully added: ${fileName}`);
			});
		})
		.catch(out.error);
}

module.exports = addCmd;

