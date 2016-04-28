var sleep = require('sleep');

describe("singleton suite 1", function () {
  it("should pass", function () {
    expect(true).toBeTruthy("true should be true");
    sleep.sleep(1);
  });
  it("should fail", function () {
    sleep.sleep(2);
    expect(false).toBeTruthy("false should not be true. This will fail");
  });
  xit("should defer", function () {
    expect(false).toBeTruthy("false should not be true. This will fail");
    sleep.sleep(10); // this won't trigger.
  });

});

describe("singleton suite 2", function () {
  it("none shall fail", function () {
    expect(true).toBeTruthy("true should be true");
  });
  it("should like monty python", function () {
    expect(true).toBeTruthy("true should be true");
  });
  it("should like Torchwood", function () {
    expect(true).toBeTruthy("true should be true");
    sleep.sleep(2);
  });
  it("should like watching Barbie", function () {
    // this one is a stretch
    expect(true).toBeTruthy("true should be true");
    sleep.sleep(4);
  });

});

xdescribe("singleton suite 3", function () {
  xit("none shall fail", function () {
    expect(true).toBeTruthy("true should be true");
  });

});
