'use strict';

const fs = require('fs');

const got = require('got');
const out = require('simple-output');
const parseHeaders = require('parse-headers');
const {parse} = require('query-string');

const saveCmd = require('./save');

function addCmd({addOptions, mockFolderName, url}) {
	const customHeaders = [].concat(addOptions.header).join('\n');

	function getData() {
		let data = addOptions.data;
		let body;
		let type;
		let form = false;
		let json = false;

		try {
			data = fs.readFileSync(data).toString();
		} catch (e) {
		}

		try {
			body = JSON.parse(data);
			type = 'application/json';
			json = true;
		} catch (e) {
			try {
				body = parse(data);
				type = 'application/x-www-form-urlencoded';
				form = true;
			} catch (e) {
				body = data;
				type = 'text/plain';
			}
		}

		return {
			body,
			form,
			json,
			type
		};
	}

	function getOpts(method) {
		let opts = {
			headers: parseHeaders(customHeaders),
			json: !addOptions.nojson,
			method: method.trim().toLowerCase()
		};

		// Set body data, skips only TRACE method
		// https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html
		if (method !== 'trace' && addOptions.data) {
			let data = getData();
			const baseOpts = Object.assign({}, opts, {
				form: data.form,
				json: data.json && !addOptions.nojson
			});

			// If no method was set using data, defaults to post
			if (!addOptions.method) {
				baseOpts.method = 'post';
			}

			// Sets data and content-type for request
			opts = Object.assign({}, baseOpts, {
				body: data.body,
				headers: Object.assign({
					'content-type': data.type
				}, baseOpts.headers)
			});
		}
		return opts;
	}

	const reqs = (addOptions.method || 'get')
		.split(',')
		.filter(Boolean)
		.map(name => getOpts(name));

	Promise.all(
		reqs.map(opts => got(url, opts))
	)
		.then(results => {
			reqs.forEach((opts, index) => saveCmd({
				mockFolderName,
				url: url,
				stdin: results[index].body,
				saveOptions: {
					hashAlgorithm: addOptions.hashAlgorithm,
					hashHeaders: addOptions.hashHeaders,
					hashCookies: addOptions.hashCookies,
					data: opts.body,
					headers: opts.headers,
					method: opts.method,
					nohash: addOptions.nohash,
					nojson: addOptions.nojson
				}
			}));
		})
		.catch(out.error);
}

module.exports = addCmd;

