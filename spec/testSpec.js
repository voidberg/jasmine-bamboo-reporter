"use strict";
var fs = require ('fs');
const cp = require('child_process');

// this ensures that I have the output struct AND ONLY THE OUTPUT STRUCT.
// I had an error where I added passing+passing instead of passes+passes.
function checkStruct(json) {
  var expected = {
    'stats' : false,
    'failures': false,
    'passes': false,
    'skipped': false
  };

  var expected_stats = {
    'suites': false,
    'tests': false,
    'passes': false,
    'pending': false,
    'failures': false,
    'start': false,
    'end': false,
    'duration': false,
    'time': false
  }

  Object.keys(json).forEach(function (key) {
    if (typeof expected[key] === 'undefined') {
      expect(false).toBeTruthy("found an unexpected key: " + key);
    } else {
      expected[key] = true;
    }
  });
  Object.keys(json.stats).forEach(function (key) {
    if (typeof expected_stats[key] === 'undefined') {
      expect(false).toBeTruthy("found an unexpected key: stats." + key);
    } else {
      expected_stats[key] = true;
    }
  });
  expect(json.stats.duration).toBe(json.stats.time, "Want time == duration");

  Object.keys(expected).forEach(function (key) {
    expect(expected[key]).toBeTruthy("Should see key " + key);
  });
  Object.keys(expected_stats).forEach(function (key) {
    expect(expected_stats[key]).toBeTruthy("Should see key stats." + key);
  });


}


describe("jasmine tests", function () {
  beforeEach(function () {
    if (fs.existsSync("results.json.lock")) fs.unlinkSync("results.json.lock");
    if (fs.existsSync("results.json")) fs.unlinkSync("results.json");
  });

  it("should collect statistics for a single thread", function () {
    cp.execSync("spec/children/jasmineRunner.js spec/children/singletonSpec.js");
    expect(fs.existsSync("results.json")).toBeTruthy("Should see a results.json");
    expect(fs.existsSync("results.json.lock")).toBeFalsy("Should not see a lockfile");

    var raw = fs.readFileSync("results.json", {encoding: 'utf8'});
    var data = JSON.parse(raw);

    checkStruct(data);

    expect(data.stats.suites).toBe(3);
    expect(data.stats.passes).toBe(5);
    expect(data.stats.failures).toBe(1, "Want 1 failure");
    expect(data.stats.pending).toBe(2);
    expect(data.stats.duration).toBe(9);
    expect(data.failures[0].duration).toBe(2);
    expect(data.failures.length).toBe(1);
    expect(data.passes[4].duration).toBe(4);
    expect(data.passes[4].fullTitle).toBe("should like watching Barbie");
    expect(data.passes.length).toBe(5);

    expect(data.skipped.length).toBe(2);
  });

  it("should handle 4 tests finishing concurrently", function (done) {
    var child = [];
    var complete = 0;
    for (var i=0;i<4;i++) {

      child[i] = cp.exec("spec/children/jasmineRunner.js spec/children/singletonSpec.js",
                         function (error, stdout, stderr) {
                           complete++;
                           if (complete == 4) {
                             var raw = fs.readFileSync("results.json", {encoding: 'utf8'});
                             var data = JSON.parse(raw);
                             checkStruct(data);
                             expect(data.stats.suites).toBe(12);
                             expect(data.stats.passes).toBe(20);
                             expect(data.stats.duration).toBeGreaterThan(8);
                             expect(data.stats.duration).toBeLessThan(10);
                             expect(data.passes.length).toBe(20);
                             expect(data.skipped.length).toBe(8);
                             expect(data.failures.length).toBe(4);

                             done(); //necessary because I'm all Asynch on this puppy.
                           }
                         });
    }

    /*    waitForChildren(child);

          for (var i=0;i<4;i++) {
          waitpid(child[i].pid);
          }

    */
  }, 20000);

  it("should blend all passes with all fails", function () {
    cp.execSync("spec/children/jasmineRunner.js spec/children/allPass.js");
    cp.execSync("spec/children/jasmineRunner.js spec/children/allFail.js");

    var raw = fs.readFileSync("results.json", {encoding: 'utf8'});
    var data = JSON.parse(raw);
    checkStruct(data);
    expect(data.stats.suites).toBe(3);
    expect(data.stats.passes).toBe(10);
    expect(data.stats.failures).toBe(3);
    expect(data.stats.duration).toBeLessThan(2);

  });


});

// we should write these too. But I'm lazy right now.
xdescribe("output tests", function () {
  xit("should beautify output when requested", function () {
  });

  xit("should handle 2, 3, or 4 character spacing", function () {
  });

  xit("should allow tabs in lieu of spaces", function () {
  });
});
