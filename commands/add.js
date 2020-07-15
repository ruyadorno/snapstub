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

		const jsonResult = () => ({
			json: JSON.parse(data)
		});

		const formResult = () => ({
			form: parse(data)
		});

		const textResult = () => ({
			body: data
		});

		// In case addOptions.data is pointing to a filename, loads that
		try {
			data = fs.readFileSync(data).toString();
		} catch (e) {}

		try {
			const jsonRes = jsonResult();
			if (addOptions.nojson) {
				return textResult();
			}

			return jsonRes;
		} catch (e) {}

		try {
			const formRes = formResult();
			return formRes;
		} catch (e) {}

		return textResult();
	}

	function getOpts(method) {
		let opts = {
			headers: parseHeaders(customHeaders),
			method: method.trim().toLowerCase()
		};

		// Set body data, skips only TRACE method
		// https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html
		if (method !== 'trace' && addOptions.data) {
			let data = getData();
			// If no method was set using data, defaults to post
			if (!addOptions.method) {
				opts.method = 'post';
			}

			// Sets data and content-type for request
			opts = Object.assign({}, opts, data, {
				headers: Object.assign({
					'content-type': data.type
				}, opts.headers)
			});
		}

		return opts;
	}

	const reqs = (addOptions.method || 'get')
		.split(',')
		.filter(Boolean)
		.map(name => getOpts(name));

	Promise.all(reqs.map(opts => got(url, opts)))
		.then(results => results.map((result, index) =>
			reqs[index].json ? result.json() : result
		))
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

