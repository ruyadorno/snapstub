# snapstub [![NPM version](https://badge.fury.io/js/snapstub.svg)](https://npmjs.org/package/snapstub) [![Build Status](https://travis-ci.org/ruyadorno/snapstub.svg?branch=master)](https://travis-ci.org/ruyadorno/snapstub)

> Heavily inspired by [Jest Snapshot testing](https://facebook.github.io/jest/blog/2016/07/27/jest-14.html)

Small command line tool that allows you to take "snapshots" of any given API endpoint and store the response. Using the `start` command you can spawn a server that will serve all previously stored endpoints.

## Install

```sh
npm install -g snapstub
```

## Usage

Make sure you're in the desired folder to host your api mock files.

Creates a new api stub:

```sh
snapstub add http://example.com/api/foo/bar
```

...create as many snapshots as you want.

Starts your mock server:

```sh
snapstub start
```

### More options

If you want to save one or many different http methods, use the `--method` flag:

```sh
snapstub add http://example.com/api/foo/bar --method=get,post,put
```

Using custom port and/or folder name:

```sh
export SNAPSTUB_FOLDER_NAME=my-mock-folder/
export SNAPSTUB_PORT=9000
snatstub start
```

### More info

By default snapshots will be saved in a `__mocks__` folder that resolves from the current working directory, so make sure you run the commands from the correct project folder you desire.

### Credit

**snapstub** wouldn't be possible without [stubborn-server](https://github.com/zeachco/stubborn-server), go take a look at it if you need to support more complex scenarios.

## License

MIT © [Ruy Adorno](http://ruyadorno.com)

