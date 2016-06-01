#!/usr/bin/node

// This runs a jasmine test with a custom reporter (the one we're trying to test)
var Jasmine = require('jasmine');
var jasmine = new Jasmine();

var JSONReporter = require('../../index');
var reporter = new JSONReporter({
  file: 'results.json',
  beautify: true,
  indentationLevel: 4
});

jasmine.addReporter(reporter);
console.log("Running test " + process.argv[2]);
jasmine.execute([process.argv[2]]);
