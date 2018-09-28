const fs = require('fs');
const path = require('path');

const jsonlint = require('jsonlint/lib/formatter');
const mkdirp = require('mkdirp');
const urlParse = require('url-parse-lax');
const out = require('simple-output');

function saveCmd(opts) {
	const saveOptions = opts.saveOptions;
	const stdin = typeof opts.stdin === 'string' ? opts.stdin : JSON.stringify(opts.stdin);
	const url = opts.url;

	const methodList = saveOptions.method || 'get';
	const methods = methodList.split(',');
	const mockFolderName = opts.mockFolderName || '__mocks__';
	const rootPath = opts.rootPath || path.join(process.cwd(), mockFolderName);
	const folderPath = path.join(rootPath, urlParse(url).pathname);
	const fileExt = saveOptions.nojson ? '.js' : '.json';

	methods.forEach(method => {
		const fileName = path.join(folderPath, method.trim() + fileExt);

		// Creates mocks folder
		mkdirp.sync(folderPath);

		// Writes mock file
		fs.writeFileSync(fileName, jsonlint.formatter.formatJson(stdin));
		out.success(`Successfully added: ${fileName}`);
	});
}

module.exports = saveCmd;

