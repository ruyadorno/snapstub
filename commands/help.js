'use strict';

function helpCmd() {
	console.log(`
Usage:
  snapstub [command]

Available commands:
  help         Output usage info
  version      Get current version number
  start        Starts the built-in static mock server
  add <url>    Takes a snapshot of a given url and stores in the local fs

Options:
  --method     Specifies different http methods to use, defaults to GET
  --header     Adds a custom header to the request

More info:
  https://github.com/ruyadorno/snapstub
`);
}

module.exports = helpCmd;

