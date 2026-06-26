import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Reporter from './index';

const FIXTURES = fileURLToPath(new URL('./__fixtures__', import.meta.url));

const BASE = Date.UTC(2026, 0, 1, 12, 0, 0);
function setT(seconds: number): void {
  vi.setSystemTime(BASE + seconds * 1000);
}
function fixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES, `${name}.json`), {
    encoding: 'utf8',
  });
}
function pass(fullName: string, description: string) {
  return { status: 'passed', fullName, description, failedExpectations: [] };
}
function fail(fullName: string, description: string, messages: string[]) {
  return {
    status: 'failed',
    fullName,
    description,
    failedExpectations: messages.map((message) => ({ message })),
  };
}
function pending(fullName: string, description: string) {
  return { status: 'pending', fullName, description, failedExpectations: [] };
}

describe('Reporter output is format-compatible with the frozen baseline', () => {
  let file: string;

  beforeEach(() => {
    vi.useFakeTimers();
    file = path.join(
      os.tmpdir(),
      `jbr-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    for (const f of [file, `${file}.lock`]) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  test('full beautified run (pass / multi-expectation fail / pending / pass)', () => {
    const r = new Reporter({ file, beautify: true, indentationLevel: 4 });
    setT(0);
    r.jasmineStarted();
    setT(10);
    r.specStarted();
    setT(11);
    r.specDone(pass('suite a should pass', 'should pass'));
    setT(20);
    r.specStarted();
    setT(22);
    r.specDone(
      fail('suite a should fail', 'should fail', [
        'Expected 1 to be 2.',
        'Expected true to be false.',
      ]),
    );
    setT(30);
    r.specStarted();
    setT(30);
    r.specDone(pending('suite a should pend', 'should pend'));
    setT(40);
    r.specStarted();
    setT(43);
    r.specDone(pass('suite b should pass slow', 'should pass slow'));
    r.suiteDone();
    r.suiteDone();
    setT(50);
    r.jasmineDone();

    expect(fs.readFileSync(file, { encoding: 'utf8' })).toBe(
      fixture('full-run'),
    );
  });

  test('single failure renders "1 Failure:"', () => {
    const r = new Reporter({ file, beautify: true, indentationLevel: 4 });
    setT(0);
    r.jasmineStarted();
    setT(5);
    r.specStarted();
    setT(7);
    r.specDone(fail('suite x boom', 'boom', ['Expected false to be truthy.']));
    r.suiteDone();
    setT(12);
    r.jasmineDone();

    expect(fs.readFileSync(file, { encoding: 'utf8' })).toBe(
      fixture('single-failure'),
    );
  });

  test('beautify:false is ignored (shallowMerge drops falsy overrides)', () => {
    const r = new Reporter({ file, beautify: false });
    setT(0);
    r.jasmineStarted();
    setT(3);
    r.specStarted();
    setT(4);
    r.specDone(pass('suite c quick', 'quick'));
    r.suiteDone();
    setT(50);
    r.jasmineDone();

    expect(fs.readFileSync(file, { encoding: 'utf8' })).toBe(
      fixture('compact'),
    );
  });

  test('merge across two runs into the same file (sharding)', () => {
    const a = new Reporter({ file, beautify: true, indentationLevel: 4 });
    setT(0);
    a.jasmineStarted();
    setT(10);
    a.specStarted();
    setT(12);
    a.specDone(pass('A pass', 'pass'));
    setT(20);
    a.specStarted();
    setT(23);
    a.specDone(fail('A fail', 'fail', ['nope']));
    a.suiteDone();
    setT(30);
    a.jasmineDone();

    const b = new Reporter({ file, beautify: true, indentationLevel: 4 });
    setT(100);
    b.jasmineStarted();
    setT(110);
    b.specStarted();
    setT(111);
    b.specDone(pass('B pass', 'pass'));
    setT(120);
    b.specStarted();
    setT(120);
    b.specDone(pending('B pend', 'pend'));
    b.suiteDone();
    b.suiteDone();
    setT(130);
    b.jasmineDone();

    expect(fs.readFileSync(file, { encoding: 'utf8' })).toBe(fixture('merge'));
  });
});

describe('the lock file is created and released around a write', () => {
  test('no .lock remains after jasmineDone', () => {
    const file = path.join(
      os.tmpdir(),
      `jbr-lock-${process.pid}-${Math.random().toString(36).slice(2)}.json`,
    );
    try {
      const r = new Reporter({ file });
      r.jasmineStarted();
      r.jasmineDone();
      expect(fs.existsSync(file)).toBe(true);
      expect(fs.existsSync(`${file}.lock`)).toBe(false);
    } finally {
      for (const f of [file, `${file}.lock`]) {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      }
    }
  });
});
