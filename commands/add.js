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

	function getData() {
		let body;
		let type;

		try {
			body = JSON.stringify(JSON.parse(argv.data));
			type = 'application/json';
		} catch (e) {
			body = argv.data;
			type = 'application/x-www-form-urlencoded';
		}

		return {
			body: body,
			type: type
		};
	}

	function getOpts(method) {
		let opts = {
			headers: parseHeaders(customHeaders),
			json: !argv.nojson,
			method: method
		};

		// set body data, skips only TRACE method
		// https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html
		if (method !== 'trace' && argv.data) {
			let data = getData();

			// if no method was set using data, defaults to post
			if (!argv.method) {
				opts.method = 'post';
			}

			// sets data and content-type for request
			opts = Object.assign({}, opts, {
				body: data.body,
				headers: Object.assign({
					'content-type': data.type
				}, opts.headers)
			});
		}
		return opts;
	}

	Promise.all(
			methods.map(name => got(url, getOpts(name.toLowerCase())))
		)
		.then(results => {
			const folderPath = path.join(rootPath, urlParse(url).pathname);
			mkdirp.sync(folderPath);
			methods.forEach((method, index) => {
				const fileExt = argv.nojson ? '.js' : '.json';
				const fileName = path.join(folderPath, method.trim() + fileExt);
				fs.writeFileSync(fileName, jsonlint.formatter.formatJson(JSON.stringify(results[index].body)));
				out.success(`Successfully added: ${fileName}`);
			});
		})
		.catch(out.error);
}

module.exports = addCmd;

