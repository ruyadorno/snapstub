# snapstub [![NPM version](https://badge.fury.io/js/snapstub.svg)](https://npmjs.org/package/snapstub) [![Build Status](https://travis-ci.org/ruyadorno/snapstub.svg?branch=master)](https://travis-ci.org/ruyadorno/snapstub)

> Heavily inspired by [Jest Snapshot testing](https://facebook.github.io/jest/blog/2016/07/27/jest-14.html)

Small command line tool that allows you to take "snapshots" of any given API endpoint and store the response. Using the `start` command will spawn a server that will serve all previously stored endpoints.

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

Usually a POST/PUT method will also require data to be send along with the request, you can do so by using the `--data` option:

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

<br/>

## Credit

**snapstub** wouldn't be possible without [stubborn-server](https://github.com/zeachco/stubborn-server) - it's a very flexible mock server based on static files, if you have the need to handle more complex scenarios (handling route params, dynamic responses, etc) go take a look at it.

## License

MIT © [Ruy Adorno](http://ruyadorno.com)

