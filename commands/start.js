'use strict';

const out = require('simple-output');
const methods = require('methods');
const hashLoader = require('stubborn-server-hash-loader');

function startCmd(opts) {
	const mockFolderName = opts.mockFolderName || '__mocks__';
	const port = opts.port || 8059;
	try {
		opts.stubborn.start({
			logMode: opts.verbose ? 'all' : 'warn',
			namespace: '',
			pathToMocks: mockFolderName,
			servePort: port,
			fallbacks: [],
			plugins: [
				{
					loader: hashLoader({
						algorithm: opts.hashAlgorithm,
						headers: opts.hashHeaders || [],
						cookies: opts.hashCookies || [],
					}),
				},
			],
		});
		if (!opts.silent) {
			out.success('Successfully launched snapstub server on: '
				+ 'http://localhost:' + port);
			printRoutes(mockFolderName, port);
		}
	} catch (_) {
		out.error('Failed to launch snapstub server');
	}
}

function printRoutes(srcPath, port) {
	const patterns = methods.map(m => `**/${m}.+(json|js|mjs|cjs)`);

	import('globby')
		.then(({globby}) => globby(patterns, {cwd: srcPath}))
		.then(paths => {
			const routes = paths.map(p => {
				// Remove filename from path
				const directoryPath = p.substring(0, p.lastIndexOf('/'));

				return `http://localhost:${port}/${directoryPath}`;
			});
			for (const route of new Set(routes)) {
				out.info(route);
			}
		});
}

module.exports = startCmd;
