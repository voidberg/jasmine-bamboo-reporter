# jasmine-bamboo-reporter
[![view on npm](http://img.shields.io/npm/v/jasmine-bamboo-reporter.svg?style=flat)](https://www.npmjs.org/package/jasmine-bamboo-reporter)
[![npm module downloads per month](http://img.shields.io/npm/dm/jasmine-bamboo-reporter.svg?style=flat)](https://www.npmjs.org/package/jasmine-bamboo-reporter)
[![Dependency status](https://david-dm.org/voidberg/jasmine-bamboo-reporter.svg?style=flat)](https://david-dm.org/voidberg/jasmine-bamboo-reporter)

> A reporter for Jasmine which produces a report compatible with Atlassian Bamboo Mocha Test Parser. It supports 'test sharding' or multiple instances of Jasmine running via Protractor. This support is handled by locking the results file and then merging with any previous results.

## Installation

```sh
npm install jasmine-bamboo-reporter
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

### Protractor/Jasmine Usage
```javascript
// in Protractor conf
var JSONReporter = require('jasmine-bamboo-reporter');
var fs = require('fs');

exports.config = {

framework: 'jasmine2',

...

beforeLaunch: function () {
    //clean up any residual/leftover from a previous run. Ensure we have clean
    //files for both locking and merging.
    if (fs.existsSync('jasmine-results.json.lock')) {
      fs.unlinkSync('jasmine-results.json.lock');
    }
    if (fs.existsSync('jasmine-results.json')) {
      fs.unlink('jasmine-results.json');
    }
},
  
onPrepare: function() {
	jasmine.getEnv().addReporter(new JSONReporter({
		file: 'jasmine-results.json', // by default it writes to jasmine.json
		beautify: true,
		indentationLevel: 4 // used if beautify === true
	}));
}
```

## License

[MIT](https://github.com/voidberg/jasmine-bamboo-reporter/blob/master/LICENSE)
