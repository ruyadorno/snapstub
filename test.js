/* eslint-env mocha */

'use strict';

const assert = require('assert');
const exec = require('child_process').exec;
const path = require('path');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const express = require('express');
const request = require('supertest');

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

describe('snapstub', function () {
	before(function (done) {
		mkdirp(path.join(__dirname, '__mocks__'), done);
	});
	after(function (done) {
		rimraf(path.join(__dirname, '__mocks__'), done);
	});
	it('should correctly save a snapshot', function (done) {
		exec('./index.js add http://localhost:9194/data', (err, stdout) => {
			if (err) {
				done(err);
			}
			const expectedFileName = path.join(__dirname, '__mocks__', 'data', 'get.json');
			assert.strictEqual(
				stdout.trim(),
				`✔  Successfully added: ${expectedFileName}`
			);
			done();
		});
	});
	it('should correctly save many snapshot methods', function (done) {
		exec('./index.js add http://localhost:9194/data --method=post,head', (err, stdout) => {
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
		});
	});
	it('should correctly retrieve snapshot data', function (done) {
		this.timeout(6000);
		exec('./index.js add http://localhost:9194/data', err => {
			if (err) {
				done(err);
			}
			const child = exec('./index.js start');
			setTimeout(() => {
				request('http://localhost:8059')
					.get('/data')
					.expect('Content-Type', /json/)
					.expect(data)
					.end(() => { // eslint-disable-line
						child.kill();
						done(err);
					});
			}, 2000);
		});
	});
	it('should correctly retrieve snapshot data from post method', function (done) {
		this.timeout(6000);
		exec('./index.js add http://localhost:9194/data --method=post', err => {
			if (err) {
				done(err);
			}
			const child = exec('./index.js start');
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
		});
	});
	it('should correctly retrieve snapshot data from multiple http methods', function (done) {
		this.timeout(6000);
		exec('./index.js add http://localhost:9194/data --method=post,get,put', err => {
			if (err) {
				done(err);
			}
			const child = exec('./index.js start');
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
		});
	});
	it('should get help message when using no valid command', function (done) {
		exec('./index.js', (err, stdout) => {
			assert.strictEqual(stdout.indexOf('Usage:'), 1);
			done(err);
		});
	});
	it('should get version number when using --version flag', function (done) {
		exec('./index.js --version', (err, stdout) => {
			assert.strictEqual(stdout.trim(), require('./package.json').version);
			done(err);
		});
	});
});

