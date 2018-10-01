const fs = require('fs');
const path = require('path');
const {parse: urlParse} = require('url');

const jsonlint = require('jsonlint/lib/formatter');
const mkdirp = require('mkdirp');
const out = require('simple-output');
const requestHash = require('request-hash');

function saveCmd(opts) {
	const {saveOptions, url} = opts;
	const stdin = typeof opts.stdin === 'string' ? opts.stdin : JSON.stringify(opts.stdin);
	const getOpts = arr => (arr && arr.split(',').filter(Boolean).map(i => i.trim())) || [];

	const {query, pathname} = urlParse(url || '', true);
	const {data, headers, hashAlgorithm, hashHeaders, hashCookies} = saveOptions;
	const hashHeadersOpts = getOpts(hashHeaders);
	const hashCookiesOpts = getOpts(hashCookies);
	const shouldHash = data ||
		Object.keys(query).length > 0 ||
		(headers && headers.length > 0 && (
			(hashHeadersOpts && hashHeadersOpts.length > 0) ||
			(hashCookiesOpts && hashCookiesOpts.length > 0)
		));

	const methodList = saveOptions.method || 'get';
	const methods = methodList.split(',');
	const mockFolderName = opts.mockFolderName || '__mocks__';
	const rootPath = opts.rootPath || path.join(process.cwd(), mockFolderName);
	const folderPath = path.join(rootPath, pathname);
	const fileExt = saveOptions.nojson ? '.js' : '.json';

	methods.forEach(method => {
		const hashSuffix = shouldHash ?
			'-' + requestHash({
				algorithm: hashAlgorithm,
				headers: hashHeadersOpts,
				cookies: hashCookiesOpts
			})({
				method,
				url,
				body: data,
				headers
			}) :
			'';
		const fileName = path.join(
			folderPath,
			method.toLowerCase().trim() + hashSuffix + fileExt
		);

		// Creates mocks folder
		mkdirp.sync(folderPath);

		// Writes mock file
		fs.writeFileSync(fileName, jsonlint.formatter.formatJson(stdin));
		out.success(`Successfully added: ${fileName}`);
	});
}

module.exports = saveCmd;

