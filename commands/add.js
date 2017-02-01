'use strict';

const fs = require('fs');
const path = require('path');

const jsonlint = require('jsonlint/lib/formatter');
const mkdirp = require('mkdirp');
const got = require('got');
const urlParse = require('url-parse-lax');
const out = require('simple-output');
const parseHeaders = require('parse-headers');

function addCmd(opts) {
	const argv = opts.argv;
	const rootPath = opts.rootPath;
	const url = argv._[1];
	const methodList = argv.method || 'get';
	const methods = methodList.split(',');
	const customHeaders = [].concat(argv.header).join('\n');
	const gotOpts = {
		headers: parseHeaders(customHeaders),
		json: !argv.nojson
	};
	Promise.all(methods.map(name => got[name](url, gotOpts)))
		.then(results => {
			const folderPath = path.join(rootPath, urlParse(url).pathname);
			mkdirp.sync(folderPath);
			methods.forEach((method, index) => {
				const fileExt = gotOpts.json ? '.json' : '';
				const fileName = path.join(folderPath, method.trim() + fileExt);
				fs.writeFileSync(fileName, jsonlint.formatter.formatJson(JSON.stringify(results[index].body)));
				out.success(`Successfully added: ${fileName}`);
			});
		})
		.catch(out.error);
}

module.exports = addCmd;

