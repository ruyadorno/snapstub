# snapstub [![NPM version](https://badge.fury.io/js/snapstub.svg)](https://npmjs.org/package/snapstub) [![Build Status](https://travis-ci.org/ruyadorno/snapstub.svg?branch=master)](https://travis-ci.org/ruyadorno/snapstub)

> Heavily inspired by [Jest Snapshot testing](https://facebook.github.io/jest/blog/2016/07/27/jest-14.html)

Small command line tool that allows you to take "snapshots" of any given API endpoint and store the response. Using the `start` command will spawn a server that will serve all previously stored endpoints.

## Install

```sh
npm install -g snapstub
```

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

If you want to save one or many different http methods, use the `--method` flag:

```sh
snapstub add http://example.com/api/foo/bar --method=get,post,put
```

### Change defaults

Using custom port and/or folder name:

```sh
export SNAPSTUB_FOLDER_NAME=my-mock-folder/
export SNAPSTUB_PORT=9000
snapstub start
```

### More info

By default snapshots will be saved in a `__mocks__` folder that resolves from the current working directory, so make sure you run the commands from the correct project folder you desire.

NOTE: **v1.x** only supports `json` endpoints.

## Credit

**snapstub** wouldn't be possible without [stubborn-server](https://github.com/zeachco/stubborn-server) - it's a very flexible mock server based on static files, if you have the need to handle more complex scenarios (handling route params, dynamic responses, etc) go take a look at it.

## License

MIT © [Ruy Adorno](http://ruyadorno.com)

