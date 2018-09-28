/* eslint-env mocha */

'use strict';

const assert = require('assert');
const p = require('child_process');
const exec = p.exec;
const spawn = p.spawn;
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
	}
};

const postData = {
	success: true
};

const putData = {
	x: 'foo'
};

express()
	.get('/data', (req, res) => {
		res.json(data);
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
	before(function (done) {
		mkdirp(path.join(__dirname, '__mocks__'), done);
	});
	after(function (done) {
		rimraf(path.join(__dirname, '__mocks__'), done);
	});
	it('should correctly save a snapshot', function (done) {
		exec('./cli.js add http://localhost:9194/data', (err, stdout) => {
			if (err) {
				done(err);
			}
			const expectedFileName = path.join(__dirname, '__mocks__', 'data', 'get.json');
			assert.strictEqual(
				stdout.trim(),
				`✔  Successfully added: ${expectedFileName}`
			);
			done();
		}).stdin.end();
	});
	it('should correctly save many snapshot methods', function (done) {
		exec('./cli.js add http://localhost:9194/data --method=post,head', (err, stdout) => {
			if (err) {
				done(err);
			}
			const postExpectedFileName = path.join(__dirname, '__mocks__', 'data', 'post.json');
			const headExpectedFileName = path.join(__dirname, '__mocks__', 'data', 'head.json');
			assert.strictEqual(
				stdout.trim(),
				`✔  Successfully added: ${postExpectedFileName}
✔  Successfully added: ${headExpectedFileName}`
			);
			done();
		}).stdin.end();
	});
	it('should be able to set a custom header when adding snapshots', function (done) {
		express()
			.get('/data', (req, res) => {
				assert.strictEqual(req.get('X-Token'), '0123F');
				res.sendStatus(200);
				done();
			})
			.listen(9195, e => {
				if (e) {
					done(e);
				}
				exec('./cli.js add http://localhost:9195/data --header "X-Token: 0123F"', err => {
					if (err) {
						done(err);
					}
				}).stdin.end();
			});
	});
	it('should be able to set multiple custom headers when adding snapshots', function (done) {
		express()
			.get('/data', (req, res) => {
				assert.strictEqual(req.get('X-Foo'), 'bar');
				assert.strictEqual(req.get('X-Token'), '0123F');
				res.sendStatus(200);
				done();
			})
			.listen(9196, e => {
				if (e) {
					done(e);
				}
				exec('./cli.js add http://localhost:9196/data --header "X-Token: 0123F" --header "X-Foo: bar"', err => {
					if (err) {
						done(err);
					}
				}).stdin.end();
			});
	});
	it('should be able to POST simple json data', function (done) {
		const bodyData = {
			foo: 'Bar'
		};
		express()
			.use(bodyParser.json())
			.post('/data', (req, res) => {
				assert.deepStrictEqual(req.body, bodyData);
				res.sendStatus(200);
				done();
			})
			.listen(9200, e => {
				if (e) {
					done(e);
				}
				exec('./cli.js add http://localhost:9200/data --data \'{ "foo": "Bar" }\'', err => { // eslint-disable-line no-useless-escape
					if (err) {
						done(err);
					}
				}).stdin.end();
			});
	});
	it('should be able to POST json data', function (done) {
		const bodyData = {
			foo: 'bar',
			more: {
				lorem: 'ipsum',
				dolor: 'sit'
			}
		};
		express()
			.use(bodyParser.json())
			.post('/data', (req, res) => {
				assert.deepStrictEqual(req.body, bodyData);
				res.sendStatus(200);
				done();
			})
			.listen(9197, e => {
				if (e) {
					done(e);
				}
				exec(`./cli.js add http://localhost:9197/data --data '${JSON.stringify(bodyData)}'`, err => {
					if (err) {
						done(err);
					}
				}).stdin.end();
			});
	});
	it('should be able to POST form data', function (done) {
		const bodyData = 'parameter=value&also=another';
		express()
			.use(bodyParser.urlencoded({extended: true}))
			.post('/data', (req, res) => {
				assert.strictEqual(req.body.parameter, 'value');
				assert.strictEqual(req.body.also, 'another');
				res.sendStatus(200);
				done();
			})
			.listen(9198, e => {
				if (e) {
					done(e);
				}
				exec(`./cli.js add http://localhost:9198/data --data "${bodyData}" --verbose`, err => {
					if (err) {
						done(err);
					}
				}).stdin.end();
			});
	});
	it('should be able to PUT form data', function (done) {
		const bodyData = 'parameter=something';
		express()
			.use(bodyParser.urlencoded({extended: true}))
			.put('/data', (req, res) => {
				assert.strictEqual(req.body.parameter, 'something');
				res.sendStatus(200);
				done();
			})
			.listen(9199, e => {
				if (e) {
					done(e);
				}
				exec(`./cli.js add http://localhost:9199/data --data "${bodyData}" --method=put`, err => {
					if (err) {
						done(err);
					}
				}).stdin.end();
			});
	});
	it('should be able to send from data file', function (done) {
		express()
			.use(bodyParser.urlencoded({extended: true}))
			.post('/data', (req, res) => {
				assert.strictEqual(req.body.dolor.trim(), 'sit');
				res.sendStatus(200);
				done();
			})
			.listen(9201, e => {
				if (e) {
					done(e);
				}
				exec('./cli.js add http://localhost:9201/data --data ./fixtures/data', err => {
					if (err) {
						done(err);
					}
				}).stdin.end();
			});
	});
	it('should be able to send from json data file', function (done) {
		express()
			.use(bodyParser.json())
			.post('/data', (req, res) => {
				assert.strictEqual(req.body.foo, 'Lorem');
				res.sendStatus(200);
				done();
			})
			.listen(9202, e => {
				if (e) {
					done(e);
				}
				exec('./cli.js add http://localhost:9202/data --data ./fixtures/data.json', err => {
					if (err) {
						done(err);
					}
				}).stdin.end();
			});
	});
	it('should correctly retrieve snapshot data', function (done) {
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
			setTimeout(() => {
				request('http://localhost:8059')
					.get('/data')
					.expect('Content-Type', /json/)
					.expect(data)
					.end(error => { // eslint-disable-line
						child.kill();
						done(err || error);
					});
			}, 2000);
		}).stdin.end();
	});
	it('should correctly retrieve snapshot data from post method', function (done) {
		this.timeout(6000);
		exec('./cli.js add http://localhost:9194/data --method=post', err => {
			if (err) {
				return done(err);
			}
			const child = spawn('./cli.js', ['start']);
			child.stderr.on('data', err => {
				throw new Error(err.toString());
			});
			child.stdin.end();
			setTimeout(() => {
				request('http://localhost:8059')
					.post('/data')
					.expect('Content-Type', /json/)
					.expect(postData)
					.end(err => { // eslint-disable-line
						child.kill();
						done(err);
					});
			}, 2000);
		}).stdin.end();
	});
	it('should correctly retrieve snapshot data from multiple http methods', function (done) {
		this.timeout(6000);
		exec('./cli.js add http://localhost:9194/data --method=post,get,put', err => {
			if (err) {
				return done(err);
			}
			const child = spawn('./cli.js', ['start']);
			child.stderr.on('data', err => {
				throw new Error(err.toString());
			});
			child.stdin.end();
			setTimeout(() => {
				request('http://localhost:8059')
					.put('/data')
					.expect('Content-Type', /json/)
					.expect(putData)
					.end(err => { // eslint-disable-line
						child.kill();
						done(err);
					});
			}, 2000);
		}).stdin.end();
	});
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
	it('should be able to save arbitrary endpoint data', function (done) {
		this.timeout(6000);
		const parent = exec('./cli.js save /foo', err => {
			if (err) {
				return done(err);
			}
			const child = spawn('./cli.js', ['start', '--silent']);
			child.on('error', done);
			child.stdin.end();
			setTimeout(() => {
				request('http://localhost:8059')
					.get('/foo')
					.expect(200)
					.expect('Content-Type', /json/)
					.expect({pork: true})
					.end(err => { // eslint-disable-line
						child.kill();
						done(err);
					});
			}, 2000);
		});
		parent.stdin.write('{"pork":true}');
		parent.stdin.end();
	});
	it('should be able to save to diff methods', function (done) {
		this.timeout(6000);
		const parent = exec('./cli.js save /foo --method=post', err => {
			if (err) {
				return done(err);
			}
			const child = spawn('./cli.js', ['start', '--silent']);
			child.on('error', done);
			child.stdin.end();
			setTimeout(() => {
				request('http://localhost:8059')
					.post('/foo')
					.expect(200)
					.expect('Content-Type', /json/)
					.end(err => { // eslint-disable-line
						child.kill();
						done(err);
					});
			}, 2000);
		});
		parent.stdin.write('{"pork":true}');
		parent.stdin.end();
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

