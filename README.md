# jasmine-bamboo-reporter
[![view on npm](http://img.shields.io/npm/v/jasmine-bamboo-reporter.svg?style=flat)](https://www.npmjs.org/package/jasmine-bamboo-reporter)
[![npm module downloads per month](http://img.shields.io/npm/dm/jasmine-bamboo-reporter.svg?style=flat)](https://www.npmjs.org/package/jasmine-bamboo-reporter)
[![Dependency status](https://david-dm.org/voidberg/jasmine-bamboo-reporter.svg?style=flat)](https://david-dm.org/voidberg/jasmine-bamboo-reporter)

> A reporter for Jasmine which produces a report compatible with Atlassian Bamboo Mocha Test Parser.

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
```

### Protractor/Jasmine Usage
```javascript
// in Protractor conf
var JSONReporter = require('jasmine-bamboo-reporter');

...

framework: 'jasmine2',
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
