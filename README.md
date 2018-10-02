<div align="center">
	<br>
	<img width="480" height="480" src="https://cdn.rawgit.com/ruyadorno/snapstub/master/logo.svg" alt="snapstub logo">
	<br>
</div>

# snapstub

[![NPM version](https://badge.fury.io/js/snapstub.svg)](https://npmjs.org/package/snapstub)
[![Build Status](https://travis-ci.org/ruyadorno/snapstub.svg?branch=master)](https://travis-ci.org/ruyadorno/snapstub)
[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://raw.githubusercontent.com/ruyadorno/snapstub/master/LICENSE)

> Snapshot-based stub/mocking of APIs

Small command line tool that allows you to take "snapshots" of any given API endpoint and store the response. Using the `start` command will spawn a server that will serve all previously stored endpoints.

Heavily inspired by [Jest Snapshot testing](https://facebook.github.io/jest/blog/2016/07/27/jest-14.html)

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Advanced Usage](#advanced-usage)
	- [Using different http methods](#using-different-http-methods)
	- [Using custom headers to add a new route](#using-custom-headers-to-add-a-new-route)
	- [Sending data when adding a new route](#sending-data-when-adding-a-new-route)
	- [Sending data read from a file](#sending-data-read-from-a-file)
	- [Deterministic mocks using query-string or headers](#deterministic-mocks-using-query-string-or-headers)
	- [Saving standard input data into a new endpoint](#saving-standard-input-data-into-a-new-endpoint)
	- [Change defaults](#change-defaults)
	- [More info](#more-info)
- [Programmatic API](#programmatic-api)
	- [add(opts)](#addopts)
	- [save(opts)](#saveopts)
	- [start(opts)](#startopts)
	- [stop()](#stop)
- [Credit](#credit)
- [Maintainers](#maintainers)
- [Contribute](#contribute)
- [License](#license)

## Install

```sh
npm install -g snapstub
```

<br/>

## Usage

Make sure you're in the desired folder to host your api mock files.

:arrow_down: Creates a new api stub:

```sh
snapstub add http://example.com/api/foo/bar
```

...create as many snapshots as you want.

:rocket: Starts your mock server:

```sh
snapstub start
```

:sparkles: Your endpoint will be locally available at: `http://localhost:8059/api/foo/bar`

<br/>

## Advanced Usage

### Using different http methods

If you want to save one or many different http methods, use the `--method` option:

```sh
snapstub add http://example.com/api/foo/bar --method=get,post,put
```

### Using custom headers to add a new route

If you need to pass a custom header along with your request, let's say one is needed for a auth token or any other reason, use the `--header` option:

```sh
snapstub add http://example.com/api/user/42 --header "X-Token: 1234"
```

You can set as many custom headers as you need:

```sh
snapstub add http://example.com/api/login --header "X-User: foo" --header "X-Token: bar"
```

### Sending data when adding a new route

Usually a POST/PUT method will also require data to be sent along with the request, you can do so by using the `--data` option:

```sh
snapstub add http://example.com/api/user/new --data "name=Foo"
```

**Content-Type** headers will be set automatically but if you specify one (using `--header` option) that will take precedence.

It also accepts json data (Content-Type will be set to `application/json` automatically):

```sh
snapstub add http://example.com/api/user/new --data '{ "name": "Lorem" }'
```

If no method is defined it defaults to **POST**, if you want to use PUT instead just use the `--method` option:

```sh
snapstub add http://example.com/api/user/update --data "name=Bar" --method=put
```

### Sending data read from a file

You can also point the `--data` option to a file in order to use the contents of that file as a payload. This is a good way to maintain repeatable calls to POST/PUT routes. Given that there is a `payload.json` file in the current working directory:

```sh
snapstub add http://example.com/api/user/add --data ./payload.json
```

Headers will be automatically added and the content will be exactly as read from the file.

### Saving standard input data into a new endpoint

This is a very useful workflow that allows you to combine Chrome's **Copy as cURL** web dev tools option with the ability to store a snapstub route.

```sh
curl http://example.com/api/foo | snapstub save /api/foo
```

or you can just save any arbitrary data:

```sh
cat foo.json | snapstub save /api/foo # similar to $ cp foo.json __mocks__/api/foo
```

or even:

```sh
echo '{"data":true}' | snapstub save /api/foo
```

### Deterministic mocks using query-string or headers

**snapstub** provides out of the box support to deterministic mocking by using query-string, headers, cookies thanks to [request-hash](https://github.com/ruyadorno/request-hash). Deterministic results for those cases will create a file name suffixed by a unique hash which **snapstub** uses in order to serve the correct value when using the `snapstub start` server.

Deterministic results for query strings in the urls is active by default, for **headers** or **cookies** however you'll need to configure which values you'll want to use in order to create the unique hash. It can be set using the `--hashHeaders` or `--hashCookies` options:

```sh
snapstub add http://example.com/api/user/42 --header "X-Token: 1234" --hashHeaders=x-token
✔  Successfully added: __mocks__/api/user/42/get-491db12454c89a51646710b06bc6c51f9d45.json
```

Both `--hashHeaders` and `--hashCookies` accepts a comma-separated list of keys.

#### Customizing hash algorithm

The algorithm used to create the unique hash can also be customized using the `--hashAlgorithm` option.

### Change defaults

Using custom port and/or folder name:

```sh
export SNAPSTUB_FOLDER_NAME=my-mock-folder/
export SNAPSTUB_PORT=9000
snapstub start
```

### More info

By default snapshots will be saved in a `__mocks__` folder that resolves from the current working directory, so make sure you run the commands from the correct project folder you desire.

<br/>

## Programmatic API

A JavaScript programmatic api is available if you're using node.js:

```js
const snapstub = require('snapstub');

// starts the mock server
snapstub.start({
	verbose: true,
	mockFolderName: '__mocks__',
	port: 8080
});
```

The following methods are available, please note all values used are just example values meant to ilustrate a common usage:

### add(opts)

```js
snapstub.add({
	url: 'http://example.com/api/v1/data',
	addOptions: {
		headers: {
			'content-type': 'application/json',
			'Cookie': 'FOO=bar;'
		},
		body: 'lorem=ipsum',
		method: 'post'
	},
	mockFolderName: '__mocks__'
});
```

### save(opts)

```js
snapstub.save({
	url: '/api/v1/data',
	saveOptions: {
		data: { foo: 'bar' },
		headers: { 'X-Foo': 'bar' },
		hashAlgorithm: 'sha256',
		hashHeaders: ['x-foo'],
		hashCookies: [],
		method: 'post',
		nojson: false
	},
	mockFolderName: '__mocks__'
});
```

### start(opts)

```js
snapstub.start({
	hashAlgorithm: 'sha256',
	hashHeaders: ['x-foo'],
	hashCookies: [],
	verbose: true,
	mockFolderName: '__mocks__',
	port: 8080
});
```

### stop()

```js
snapstub.stop();
```

<br/>

## Credits

- Logo: **Camera** by Simon Child from the Noun Project
- **snapstub** wouldn't be possible without [stubborn-server](https://github.com/zeachco/stubborn-server) - it's a very flexible mock server based on static files, if you have the need to handle more complex scenarios (handling route params, dynamic responses, etc) go take a look at it.

## Maintainers

- [@RuyAdorno](https://github.com/ruyadorno)

## Contribute

Please do! This is an open source project. If you would like a feature, open a pull request. If you have a bug or want to discuss something, [open an issue](https://github.com/ruyadorno/snapstub/issues/new).

## License

[MIT](LICENSE) © [Ruy Adorno](http://ruyadorno.com)
