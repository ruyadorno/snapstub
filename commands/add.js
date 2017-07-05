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
	const addOptions = opts.addOptions;
	const mockFolderName = opts.mockFolderName || '__mocks__';
	const rootPath = opts.rootPath || path.join(process.cwd(), mockFolderName);
	const url = opts.url;
	const methodList = addOptions.method || 'get';
	const methods = methodList.split(',');
	const customHeaders = [].concat(addOptions.header).join('\n');

	function getData() {
		let data = addOptions.data;
		let body;
		let type;

		try {
			data = fs.readFileSync(data).toString();
		} catch (e) {
		}

		try {
			body = JSON.stringify(JSON.parse(data));
			type = 'application/json';
		} catch (e) {
			body = data;
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
			json: !addOptions.nojson,
			method: method
		};

		// set body data, skips only TRACE method
		// https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html
		if (method !== 'trace' && addOptions.data) {
			let data = getData();

			// if no method was set using data, defaults to post
			if (!addOptions.method) {
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
				const fileExt = addOptions.nojson ? '.js' : '.json';
				const fileName = path.join(folderPath, method.trim() + fileExt);
				fs.writeFileSync(fileName, jsonlint.formatter.formatJson(JSON.stringify(results[index].body)));
				out.success(`Successfully added: ${fileName}`);
			});
		})
		.catch(out.error);
}

module.exports = addCmd;

