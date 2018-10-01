/* eslint-env mocha */

'use strict';

const assert = require('assert');
const {exec, spawn} = require('child_process');
const path = require('path');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');

const data = {
	foo: 'bar',
	lorem: 'Ipsum',
	a: {
		b: 'c'
	},
	query: {}
};

const postData = {
	success: true
};

const putData = {
	x: 'foo'
};

express()
	.get('/data', (req, res) => {
		res.json(Object.assign({},
			data,
			{query: req.query}
		));
	})
	.post('/data', (req, res) => {
		res.json(postData);
	})
	.put('/data', (req, res) => {
		res.json(putData);
	})
	.listen(9194);

describe('snapstub api', function () {
	const snapstub = require('./');

	// Mute stdout prints
	const out = require('simple-output');
	const _write = out.stdout.write;
	out.stdout.write = a => a;

	it('should correctly start a server', function (done) {
		snapstub.start({
			verbose: false,
			mockFolderName: 'mocks'
		});
		request('http://localhost:8059')
			.get('/data')
			.expect(200)
			.expect('Content-Type', /json/)
			.expect(data)
			.end(err => {
				out.stdout.write = _write;
				snapstub.stop();
				done(err);
			});
	});
});

describe('snapstub cli', function () {
	function runOnly({
		cmd,
		expected
	}) {
		return function (done) {
			exec(cmd, (err, stdout) => {
				if (err) {
					done(err);
				}
				assert.strictEqual(stdout.trim(), expected);
				done();
			}).stdin.end();
		};
	}

	function runMockTest({
		cmd,
		port,
		method,
		middleware,
		test
	}) {
		return function (done) {
			const emptyMiddleware = (a, b, n) => {
				n();
			};
			express()
				.use(middleware || emptyMiddleware)[method]('/data', (req, res) => {
					test(req, res);
					done();
				})
				.listen(port, e => {
					if (e) {
						done(e);
					}
					exec(cmd, err => {
						if (err) {
							done(err);
						}
					}).stdin.end();
				});
		};
	}

	function runAndLoadMockTest({
		cmd,
		debug,
		supertests,
		stdinWrite
	}) {
		return function (done) {
			this.timeout(6000);
			const p = exec(`${cmd}${debug ? ' --debug' : ''}`, (err, stdout) => {
				if (debug) {
					console.log(stdout);
				}
				if (err) {
					return done(err);
				}
				const child = spawn('./cli.js', ['start']);
				if (debug) {
					child.stdout.on('data', i => console.log(i.toString()));
				}
				child.stderr.on('data', err => {
					throw new Error(err.toString());
				});
				child.stdin.end();
				setTimeout(() => {
					supertests()
						.end(err => {
							child.kill();
							done(err);
						});
				}, 2000);
			});
			if (stdinWrite) {
				p.stdin.write(stdinWrite);
			}
			p.stdin.end();
		};
	}

	before(function (done) {
		mkdirp(path.join(__dirname, '__mocks__'), done);
	});

	after(function (done) {
		rimraf(path.join(__dirname, '__mocks__'), done);
	});

	// RunOnly

	it('should correctly save a snapshot', runOnly({
		cmd: './cli.js add http://localhost:9194/data',
		expected: `✔  Successfully added: ${path.join(__dirname, '__mocks__', 'data', 'get.json')}`
	}));

	it('should correctly save many snapshot methods', runOnly({
		cmd: './cli.js add http://localhost:9194/data --method=post,head',
		expected: `✔  Successfully added: ${path.join(__dirname, '__mocks__', 'data', 'post.json')}
✔  Successfully added: ${path.join(__dirname, '__mocks__', 'data', 'head.json')}`
	}));

	it('should correctly save query param using hashed filename', runOnly({
		cmd: './cli.js add http://localhost:9194/data?foo=bar',
		expected: `✔  Successfully added: ${path.join(__dirname, '__mocks__', 'data', 'get-e86365266e9e38d9a280c46142e665acbb2a262a9a00281be4a41309b678e952.json')}`
	}));

	it('should correctly save using hashAlgorithm option', runOnly({
		cmd: './cli.js add http://localhost:9194/data?foo=bar --hashAlgorithm=md5',
		expected: `✔  Successfully added: ${path.join(__dirname, '__mocks__', 'data', 'get-e198fcea7ddae86f20d9844a2243b714.json')}`
	}));

	it('should correctly save using hashHeaders option', runOnly({
		cmd: './cli.js add http://localhost:9194/data --hashHeaders=content-type --header="Content-Type: application/json"',
		expected: `✔  Successfully added: ${path.join(__dirname, '__mocks__', 'data', 'get-e198fcea7ddae86f20d9844a2243b714.json')}`
	}));

	it('should correctly save using multiple hashHeaders option', runOnly({
		cmd: './cli.js add http://localhost:9194/data --hashHeaders=content-type --header="Content-Type: application/json"',
		expected: `✔  Successfully added: ${path.join(__dirname, '__mocks__', 'data', 'get-e198fcea7ddae86f20d9844a2243b714.json')}`
	}));

	// ---

	// RunMockTest

	it('should be able to set a custom header when adding snapshots', runMockTest({
		cmd: './cli.js add http://localhost:9195/data --header "X-Token: 0123F"',
		method: 'get',
		port: 9195,
		test: (req, res) => {
			assert.strictEqual(req.get('X-Token'), '0123F');
			res.sendStatus(200);
		}
	}));

	it('should be able to set multiple custom headers when adding snapshots', runMockTest({
		cmd: './cli.js add http://localhost:9196/data --header "X-Token: 0123F" --header "X-Foo: bar"',
		method: 'get',
		port: 9196,
		test: (req, res) => {
			assert.strictEqual(req.get('X-Foo'), 'bar');
			assert.strictEqual(req.get('X-Token'), '0123F');
			res.sendStatus(200);
		}
	}));

	it('should be able to POST simple json data', runMockTest({
		cmd: './cli.js add http://localhost:9200/data --data \'{ "foo": "Bar" }\'', // eslint-disable-line no-useless-escape
		method: 'post',
		middleware: bodyParser.json(),
		port: 9200,
		test: (req, res) => {
			assert.deepStrictEqual(req.body, {foo: 'Bar'});
			res.sendStatus(200);
		}
	}));

	it('should be able to POST json data', (bodyData => runMockTest({
		cmd: `./cli.js add http://localhost:9197/data --data '${JSON.stringify(bodyData)}'`,
		method: 'post',
		middleware: bodyParser.json(),
		port: 9197,
		test: (req, res) => {
			assert.deepStrictEqual(req.body, bodyData);
			res.sendStatus(200);
		}
	}))({
		foo: 'bar',
		more: {
			lorem: 'ipsum',
			dolor: 'sit'
		}
	}));

	it('should be able to POST form data', runMockTest({
		cmd: './cli.js add http://localhost:9198/data --data "parameter=value&also=another" --verbose',
		method: 'post',
		middleware: bodyParser.urlencoded({extended: true}),
		port: 9198,
		test: (req, res) => {
			assert.strictEqual(req.body.parameter, 'value');
			assert.strictEqual(req.body.also, 'another');
			res.sendStatus(200);
		}
	}));

	it('should be able to PUT form data', runMockTest({
		cmd: './cli.js add http://localhost:9199/data --data "parameter=something" --method=put',
		method: 'put',
		middleware: bodyParser.urlencoded({extended: true}),
		port: 9199,
		test: (req, res) => {
			assert.strictEqual(req.body.parameter, 'something');
			res.sendStatus(200);
		}
	}));

	it('should be able to send from data file', runMockTest({
		cmd: './cli.js add http://localhost:9201/data --data ./fixtures/data',
		method: 'post',
		middleware: bodyParser.urlencoded({extended: true}),
		port: 9201,
		test: (req, res) => {
			assert.strictEqual(req.body.dolor.trim(), 'sit');
			res.sendStatus(200);
		}
	}));

	it('should be able to send from json data file', runMockTest({
		cmd: './cli.js add http://localhost:9202/data --data ./fixtures/data.json',
		method: 'post',
		middleware: bodyParser.json(),
		port: 9202,
		test: (req, res) => {
			assert.strictEqual(req.body.foo, 'Lorem');
			res.sendStatus(200);
		}
	}));

	// ---

	// RunAndLoadMockTest

	it('should correctly retrieve snapshot data', runAndLoadMockTest({
		cmd: './cli.js add http://localhost:9194/data',
		supertests: () => request('http://localhost:8059')
			.get('/data')
			.expect('Content-Type', /json/)
			.expect(data)
	}));

	it('should correctly retrieve snapshot data from post method', runAndLoadMockTest({
		cmd: './cli.js add http://localhost:9194/data --method=post',
		supertests: () => request('http://localhost:8059')
			.post('/data')
			.expect('Content-Type', /json/)
			.expect(postData)
	}));

	it('should correctly retrieve snapshot data from multiple http methods', runAndLoadMockTest({
		cmd: './cli.js add http://localhost:9194/data --method=post,get,put',
		supertests: () => request('http://localhost:8059')
			.put('/data')
			.expect('Content-Type', /json/)
			.expect(putData)
	}));

	it('should be able to save arbitrary endpoint data', runAndLoadMockTest({
		cmd: './cli.js save /foo',
		supertests: () => request('http://localhost:8059')
			.get('/foo')
			.expect(200)
			.expect('Content-Type', /json/)
			.expect({pork: true}),
		stdinWrite: '{"pork":true}'
	}));

	it('should be able to save to diff methods', runAndLoadMockTest({
		cmd: './cli.js save /foo --method=post',
		supertests: () => request('http://localhost:8059')
			.post('/foo')
			.expect(200)
			.expect('Content-Type', /json/),
		stdinWrite: '{"pork":true}'
	}));

	it('should be able to save and retrieve specific added endpoint using query string parameters', runAndLoadMockTest({
		cmd: './cli.js add http://localhost:9194/data?msg=lorem%20ipsum',
		supertests: () => request('http://localhost:8059')
			.get('/data')
			.query({
				msg: 'lorem ipsum'
			})
			.expect('Content-Type', /json/)
			.expect(Object.assign({}, data, {
				query: {
					msg: 'lorem ipsum'
				}
			}))
	}));

	it('should be able to save and retrieve specific added endpoint using multiple query string parameters', runAndLoadMockTest({
		cmd: './cli.js add http://localhost:9194/data?foo=bar\\&lorem=ipsum',
		supertests: () => request('http://localhost:8059')
			.get('/data')
			.query({
				foo: 'bar',
				lorem: 'ipsum'
			})
			.expect('Content-Type', /json/)
			.expect(Object.assign({}, data, {
				query: {
					foo: 'bar',
					lorem: 'ipsum'
				}
			}))
	}));

	// ---

	it('should print route messages to console by default', function (done) {
		this.timeout(6000);
		exec('./cli.js add http://localhost:9194/data', err => {
			if (err) {
				return done(err);
			}
			const child = spawn('./cli.js', ['start']);
			child.stderr.on('data', err => {
				throw new Error(err.toString());
			});
			child.stdin.end();
			function validateRouteMsg() {
				child.stdout.once('data', d => {
					assert.equal(d.toString(), 'ℹ  http://localhost:8059/data/\n');
				});
			}
			function validateSuccessMsg() {
				child.stdout.once('data', data => {
					assert.equal(data.toString(), '✔  Successfully launched snapstub server on: http://localhost:8059\n');
					validateRouteMsg();
				});
			}
			validateSuccessMsg();
			setTimeout(() => {
				child.kill();
				done(err);
			}, 2000);
		}).stdin.end();
	});

	it('should print messages to console when using --verbose option', function (done) {
		this.timeout(6000);
		exec('./cli.js add http://localhost:9194/data', err => {
			if (err) {
				return done(err);
			}
			const child = spawn('./cli.js', ['start', '--verbose']);
			child.stderr.on('data', err => {
				throw new Error(err.toString());
			});
			child.stdin.end();
			child.stdout.on('data', data => {
				assert.notEqual(data.toString().split('pathToMocks'), -1);
				child.kill();
				done(err);
			});
		}).stdin.end();
	});

	it('should not print messages to console when using --silent option', function (done) {
		this.timeout(6000);
		exec('./cli.js add http://localhost:9194/data', err => {
			if (err) {
				return done(err);
			}
			const child = spawn('./cli.js', ['start', '--silent']);
			child.stderr.on('data', err => {
				throw new Error(err.toString());
			});
			child.stdout.on('data', data => {
				throw new Error(data);
			});
			child.stdin.end();
			setTimeout(() => {
				request('http://localhost:8059')
					.post('/data')
					.expect(200);
				child.kill();
				done();
			}, 2000);
		}).stdin.end();
	});

	it('should be able to save to multiple methods', function (done) {
		this.timeout(6000);
		const parent = exec('./cli.js save /foo --method=post,put', err => {
			if (err) {
				return done(err);
			}
			const child = spawn('./cli.js', ['start', '--silent']);
			child.on('error', done);
			child.stdin.end();
			setTimeout(() => {
				request('http://localhost:8059')
					.put('/foo')
					.expect(200)
					.expect('Content-Type', /json/)
					.end(err => { // eslint-disable-line
						if (err) {
							child.kill();
							done(err);
						}
						request('http://localhost:8059')
							.post('/foo')
							.expect(200)
							.expect('Content-Type', /json/)
							.end(err => { // eslint-disable-line
								child.kill();
								done(err);
							});
					});
			}, 2000);
		});
		parent.stdin.write('{"pork":true}');
		parent.stdin.end();
	});

	it('should get help message when using no valid command', function (done) {
		exec('./cli.js', (err, stdout) => {
			assert.strictEqual(stdout.indexOf('Usage:'), 1);
			done(err);
		}).stdin.end();
	});

	it('should get version number when using --version flag', function (done) {
		exec('./cli.js --version', (err, stdout) => {
			assert.strictEqual(stdout.trim(), require('./package.json').version);
			done(err);
		}).stdin.end();
	});
});

