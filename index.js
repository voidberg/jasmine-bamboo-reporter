var fs = require('fs');

function format(result) {
  var formatted = '';
  var msg = [];
  var counter = 1;

  if (result.failedExpectations.length === 1) {
    formatted = '1 Failure: ';
  } else {
    formatted = result.failedExpectations.length + ' Failures: ';
  }

  result.failedExpectations.forEach(function iterator(expectation) {
    msg.push(counter + '. : ' + expectation.message);
    counter++;
  });

  formatted += msg.join('\n');

  return formatted;
}

function shallowMerge(obj1, obj2) {
  var mergedObj = {};

  Object.keys(obj1).forEach(function iterator(key) {
    if (!obj2[key]) {
      mergedObj[key] = obj1[key];
    } else {
      mergedObj[key] = obj2[key];
    }
  });

  return mergedObj;
}

function reporter(opts) {
  var defaultOpts = {
    file: 'jasmine.json',
    beautify: true,
    indentationLevel: 4,
  };
  var options = shallowMerge(defaultOpts, typeof opts === 'object' ? opts : {});
  var spec = {};
  var specStart;
  var output = {
    stats: {
      suites: 0,
      tests: 0,
      passes: 0,
      pending: 0,
      failures: 0,
      start: 0,
      end: 0,
      duration: 0,
    },
    failures: [],
    passes: [],
    skipped: [],
  };

  this.suiteDone = function suiteDone() {
    output.stats.suites++;
  };

  this.specStarted = function specStarted() {
    specStart = new global.Date();
  };

  this.specDone = function specDone(result) {
    spec.duration = Math.floor((new global.Date().getTime() - specStart.getTime()) / 1000);
    spec.title = result.fullName;
    spec.fullTitle = result.description;

    output.stats.tests++;

    if (result.status === 'passed') {
      output.stats.passes++;
      output.passes.push(spec);
    } else if (result.status === 'failed') {
      output.stats.failures++;
      spec.error = format(result);
      output.failures.push(spec);
    } else {
      output.stats.pending++;
      output.skipped.push(spec);
    }

    spec = {};
  };

  this.jasmineStarted = function jasmineStarted() {
    output.stats.start = new global.Date();
  };

  this.jasmineDone = function jasmineDone() {
    var resultsOutput;
    output.stats.end = new global.Date();
    output.stats.duration = Math.floor((output.stats.end.getTime() - output.stats.start.getTime()) / 1000);

    resultsOutput = options.beautify ? JSON.stringify(output, null, options.indentationLevel) : JSON.stringify(output);

    fs.writeFileSync(options.file, resultsOutput);
  };
}

module.exports = reporter;
