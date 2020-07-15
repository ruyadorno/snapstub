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
		let result = {};

		const jsonResult = () => ({
			json: JSON.parse(data),
			type: 'application/json'
		});

		const formResult = () => ({
			form: parse(data),
			type: 'application/x-www-form-urlencoded'
		});

		const textResult = () => ({
			body: data,
			type: 'text/plain'
		});

		try {
			data = fs.readFileSync(data).toString();
		} catch (e) {
		}

		try {
<<<<<<< Updated upstream
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
=======
			if (addOptions.nojson) {
				result = textResult();
			} else {
				result = jsonResult();
			}
		} catch (e) { // eslint-disable-line no-unused-vars
			try {
				result = formResult();
			} catch (e) { // eslint-disable-line no-unused-vars
				result = textResult();
>>>>>>> Stashed changes
			}
		}

		return result;
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

	console.log(reqs);

	Promise.all(reqs.map(opts => {
		const req = got(url, opts);
		return opts.json ? req.json() : req;
	}))
		.then(r => {
			console.log(r);
			return r;
		})
		/*
		.then(results => results.map((result, index) =>
			reqs[index].json ? result.json() : result
		))
		*/
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

