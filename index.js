const fs = require('fs');
const lockFile = require('lockfile');


function format(result) {
  const msg = [];
  let counter = 1;
  let formatted;

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
  const mergedObj = {};

  Object.keys(obj1).forEach(function iterator(key) {
    if (!obj2[key]) {
      mergedObj[key] = obj1[key];
    } else {
      mergedObj[key] = obj2[key];
    }
  });

  return mergedObj;
}

function Reporter(opts) {
  const defaultOpts = {
    file: 'jasmine.json',
    beautify: true,
    indentationLevel: 4,
  };
  this.options = shallowMerge(defaultOpts, typeof opts === 'object' ? opts : {});

  this.spec = {};
  this.specStart = 0;
  this.output = {
    stats: {
      suites: 0,
      tests: 0,

      passes: 0,
      pending: 0,
      failures: 0,

      start: 0, // this is the overall time for everything. - all suites.
      end: 0,
      duration: 0,
      time: 0, // bamboo + mocha seem to be using "time", not duration.
    },
    failures: [],
    passes: [],
    skipped: [],
  };
}

Reporter.prototype.suiteDone = function suiteDone() {
  this.output.stats.suites++;
};

Reporter.prototype.specStarted = function specStarted() {
  this.specStart = new Date();
};

Reporter.prototype.specDone = function specDone(result) {
  this.spec.duration = Math.floor((new Date().getTime() - this.specStart.getTime()) / 1000);
  this.spec.time = this.spec.duration;
  this.spec.title = result.fullName;
  this.spec.fullTitle = result.description;

  this.output.stats.tests++;

  if (result.status === 'passed') {
    this.output.stats.passes++;
    this.output.passes.push(this.spec);
  } else if (result.status === 'failed') {
    this.output.stats.failures++;
    this.spec.error = format(result);
    this.output.failures.push(this.spec);
  } else {
    this.output.stats.pending++;
    this.output.skipped.push(this.spec);
  }

  this.spec = {};
};

Reporter.prototype.jasmineStarted = function jasmineStarted() {
  this.output.stats.start = new Date();
};

Reporter.prototype.mergeOutput = function mergeOutput(previous) {
  this.output.stats.suites = this.output.stats.suites + previous.stats.suites;
  this.output.stats.tests = this.output.stats.tests + previous.stats.tests;

  this.output.stats.passes = this.output.stats.passes + previous.stats.passes;
  this.output.stats.pending = this.output.stats.pending + previous.stats.pending;
  this.output.stats.failures = this.output.stats.failures + previous.stats.failures;

  this.output.start = previous.start;
  // retain output.end from this run, not the previous run.
  // math on duration will be computed elsewhere
  this.output.failures = this.output.failures.concat(previous.failures);
  this.output.passes = this.output.passes.concat(previous.passes);
  this.output.skipped = this.output.skipped.concat(previous.skipped);
};


// jasmineDone gets called multiple times, once for each process (thread) we are executing. Normally this would
// just be one thread, but protractor can "shard" tests which really just runs multiple processes with one
// to rule them all.
//
// Since that code is running in separate processes, it isn't easy to use a global/static class variable to
// handle a single instance of the jasmine reporter - nor is it easy to aggregate the results. So the trick here
// is to lock, read any file that exists, merge, write results to file, and then release lock.
Reporter.prototype.jasmineDone = function jasmineDone() {
  const self = this;
  const lockname = this.options.file + '.lock';
  let resultsOutput;
  let previous;
  let raw;

  self.output.stats.end = new Date();


  lockFile.lock(lockname, {wait: 2000}, function postLock(er) {
    if (er) {
      console.error('Jasmine bamboo reporter unable to acquire a file lock for ' + lockname);
      return;
    }
    // we can ensure that no other process will update the results causing a write-afte-read hazard.

    if (fs.existsSync(self.options.file)) {
      raw = fs.readFileSync(self.options.file, {encoding: 'utf8'});
      previous = JSON.parse(raw);
      self.mergeOutput(previous);
    }
    self.output.stats.duration = Math.floor((self.output.stats.end.getTime() - self.output.stats.start.getTime()) / 1000);
    self.output.stats.time = self.output.stats.duration;
    resultsOutput = self.options.beautify ? JSON.stringify(self.output, null, self.options.indentationLevel) : JSON.stringify(self.output);
    fs.writeFileSync(self.options.file, resultsOutput);
    lockFile.unlock(lockname, function postUnlock(erUnlock) {
      if (erUnlock) {
        console.error('Jasmine bamboo reporter could not unlock file ' + lockname);
      }
    });
  });
};

module.exports = Reporter;
