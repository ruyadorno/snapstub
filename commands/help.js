'use strict';

function helpCmd() {
	console.log(`
Usage:
  snapstub [command]

Available commands:
  help         Output usage info
  version      Get current version number
  save         Saves data from stdin straight to a url location
  start        Starts the built-in static mock server
  add <url>    Takes a snapshot of a given url and stores in the local fs

Options:
  --data           Request payload body to be send along with add|save command
  --method         Specifies http method to use along with add|save command
  --header         Adds a custom header to the request for add|save command
  --nohash         Don't generate hashed-filenames on add|save command
  --nojson         Allow for saving html|text only on add|save command
  --hashAlgorithm  Algorithm to be used for deterministic responses
  --hashHeaders    Comma-separated list of header keys to be used on hash
  --hashCookies    Comma-separated list of cookies keys to be used on hash
  --verbose        Output debug info when used along with the start command
  --silent         Mutes output when used along with the start command

More info:
  https://github.com/ruyadorno/snapstub
`);
}

module.exports = helpCmd;

