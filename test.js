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

express()
	.get('/data', (req, res) => {
		res.json(data);
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
		exec('snapstub add http://localhost:9194/data', (err, stdout) => {
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
		exec('snapstub add http://localhost:9194/data --method=post,head', (err, stdout) => {
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
		exec('snapstub add http://localhost:9194/data', err => {
			if (err) {
				done(err);
			}
			const child = exec('snapstub start');
			setTimeout(() => {
				request('http://localhost:8059')
					.get('/data')
					.expect('Content-Type', /json/)
					.expect(data)
					.end(() => { // eslint-disable-line
						child.kill();
						done();
					});
			}, 2000);
		});
	});
});

