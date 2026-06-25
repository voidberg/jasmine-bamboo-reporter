# jasmine-bamboo-reporter
[![npm version](https://img.shields.io/npm/v/jasmine-bamboo-reporter.svg?style=flat)](https://www.npmjs.com/package/jasmine-bamboo-reporter)
[![npm downloads per month](https://img.shields.io/npm/dm/jasmine-bamboo-reporter.svg?style=flat)](https://www.npmjs.com/package/jasmine-bamboo-reporter)
[![CI](https://github.com/voidberg/jasmine-bamboo-reporter/actions/workflows/ci.yml/badge.svg)](https://github.com/voidberg/jasmine-bamboo-reporter/actions/workflows/ci.yml)

> A reporter for Jasmine which produces a report compatible with Atlassian Bamboo Mocha Test Parser. It supports test sharding and other setups that run Jasmine across multiple processes, locking the results file and merging with any previous results.

## Installation

```sh
npm install --save-dev jasmine-bamboo-reporter
```

## Usage

### Jasmine Usage
```javascript
var JSONReporter = require('jasmine-bamboo-reporter');
jasmine.getEnv().addReporter(new JSONReporter({
	file: 'jasmine-results.json', // by default it writes to jasmine.json
	beautify: true,
	indentationLevel: 4 // used if beautify === true
}));

//ensure there are no lock files and no previous results to merge against.
if (fs.existsSync("jasmine-results.json.lock")) fs.unlinkSync("jasmine-results.json.lock");
if (fs.existsSync("jasmine-results.json")) fs.unlinkSync("jasmine-results.json");

```

### Parallel and sharded runs

When several Jasmine processes write to the same results file, the reporter locks the file and merges each run into it, so a sharded run still ends with a single combined report. This works with any setup that runs Jasmine across multiple processes, whether that is CI shards, a parallel runner such as WebdriverIO, or your own launcher.

Add the reporter in each process as shown above, and clear any stale results and lock file once before the run starts, not inside each process:

```javascript
var fs = require('fs');

if (fs.existsSync('jasmine-results.json.lock')) fs.unlinkSync('jasmine-results.json.lock');
if (fs.existsSync('jasmine-results.json')) fs.unlinkSync('jasmine-results.json');
```

## Example output

A run with one passing spec, one failing spec, and one skipped spec writes:

```json
{
  "stats": {
    "suites": 3,
    "tests": 8,
    "passes": 5,
    "pending": 2,
    "failures": 1,
    "start": "2026-06-25T12:00:00.000Z",
    "end": "2026-06-25T12:00:09.000Z",
    "duration": 9,
    "time": 9
  },
  "failures": [
    {
      "duration": 2,
      "time": 2,
      "title": "singleton suite 1 should fail",
      "fullTitle": "should fail",
      "error": "1 Failure: 1. : Expected false to be truthy 'false should not be true. This will fail'."
    }
  ],
  "passes": [
    {
      "duration": 1,
      "time": 1,
      "title": "singleton suite 1 should pass",
      "fullTitle": "should pass"
    }
  ],
  "skipped": [
    {
      "duration": 0,
      "time": 0,
      "title": "singleton suite 1 should defer",
      "fullTitle": "should defer"
    }
  ]
}
```

## License

[MIT](https://github.com/voidberg/jasmine-bamboo-reporter/blob/master/LICENSE)
