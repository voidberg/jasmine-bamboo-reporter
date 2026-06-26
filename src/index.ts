import fs from 'node:fs';

export interface ReporterOptions {
  /** Path of the JSON report file to write. Defaults to `jasmine.json`. */
  file?: string;
  /** Pretty-print the JSON output. Defaults to `true`. */
  beautify?: boolean;
  /** Indentation width used when `beautify` is enabled. Defaults to `4`. */
  indentationLevel?: number;
}

interface FailedExpectation {
  message: string;
}

interface SpecResult {
  status: string;
  fullName: string;
  description: string;
  failedExpectations: FailedExpectation[];
}

interface SpecEntry {
  duration: number;
  time: number;
  title: string;
  fullTitle: string;
  error?: string;
}

interface Stats {
  suites: number;
  tests: number;
  passes: number;
  pending: number;
  failures: number;
  start: number | Date;
  end: number | Date;
  duration: number;
  time: number;
}

interface Report {
  stats: Stats;
  failures: SpecEntry[];
  passes: SpecEntry[];
  skipped: SpecEntry[];
  start?: unknown;
}

function format(result: SpecResult): string {
  const msg: string[] = [];
  let counter = 1;
  let formatted: string;

  if (result.failedExpectations.length === 1) {
    formatted = '1 Failure: ';
  } else {
    formatted = `${result.failedExpectations.length} Failures: `;
  }

  result.failedExpectations.forEach(function iterator(expectation) {
    msg.push(`${counter}. : ${expectation.message}`);
    counter++;
  });

  formatted += msg.join('\n');

  return formatted;
}

function shallowMerge(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
): Record<string, unknown> {
  const mergedObj: Record<string, unknown> = {};

  Object.keys(obj1).forEach(function iterator(key) {
    if (!obj2[key]) {
      mergedObj[key] = obj1[key];
    } else {
      mergedObj[key] = obj2[key];
    }
  });

  return mergedObj;
}

function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// Cross-process advisory lock using an exclusive-create lock file (O_EXCL), the
// same primitive the former `lockfile` dependency used internally. Polls until
// the lock is acquired or `waitMs` elapses.
function acquireLock(lockPath: string, waitMs: number): boolean {
  const deadline = Date.now() + waitMs;
  for (;;) {
    try {
      fs.closeSync(fs.openSync(lockPath, 'wx'));
      return true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw err;
      }
      if (Date.now() >= deadline) {
        return false;
      }
      sleep(100);
    }
  }
}

function releaseLock(lockPath: string): void {
  try {
    fs.unlinkSync(lockPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }
}

export default class Reporter {
  private options: Required<ReporterOptions>;
  private spec: Partial<SpecEntry>;
  private specStart: number | Date;
  private output: Report;

  constructor(opts?: ReporterOptions) {
    const defaultOpts = {
      file: 'jasmine.json',
      beautify: true,
      indentationLevel: 4,
    };
    this.options = shallowMerge(
      defaultOpts,
      typeof opts === 'object' ? (opts as Record<string, unknown>) : {},
    ) as Required<ReporterOptions>;

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

  suiteDone(): void {
    this.output.stats.suites++;
  }

  specStarted(): void {
    this.specStart = new Date();
  }

  specDone(result: SpecResult): void {
    this.spec.duration = Math.floor(
      (Date.now() - (this.specStart as Date).getTime()) / 1000,
    );
    this.spec.time = this.spec.duration;
    this.spec.title = result.fullName;
    this.spec.fullTitle = result.description;

    this.output.stats.tests++;

    if (result.status === 'passed') {
      this.output.stats.passes++;
      this.output.passes.push(this.spec as SpecEntry);
    } else if (result.status === 'failed') {
      this.output.stats.failures++;
      this.spec.error = format(result);
      this.output.failures.push(this.spec as SpecEntry);
    } else {
      this.output.stats.pending++;
      this.output.skipped.push(this.spec as SpecEntry);
    }

    this.spec = {};
  }

  jasmineStarted(): void {
    this.output.stats.start = new Date();
  }

  mergeOutput(previous: Report): void {
    this.output.stats.suites = this.output.stats.suites + previous.stats.suites;
    this.output.stats.tests = this.output.stats.tests + previous.stats.tests;

    this.output.stats.passes = this.output.stats.passes + previous.stats.passes;
    this.output.stats.pending =
      this.output.stats.pending + previous.stats.pending;
    this.output.stats.failures =
      this.output.stats.failures + previous.stats.failures;

    this.output.start = previous.start;
    // retain output.end from this run, not the previous run.
    // math on duration will be computed elsewhere
    this.output.failures = this.output.failures.concat(previous.failures);
    this.output.passes = this.output.passes.concat(previous.passes);
    this.output.skipped = this.output.skipped.concat(previous.skipped);
  }

  // jasmineDone gets called multiple times, once for each process (thread) we are executing. Normally this would
  // just be one thread, but protractor can "shard" tests which really just runs multiple processes with one
  // to rule them all.
  //
  // Since that code is running in separate processes, it isn't easy to use a global/static class variable to
  // handle a single instance of the jasmine reporter - nor is it easy to aggregate the results. So the trick here
  // is to lock, read any file that exists, merge, write results to file, and then release lock.
  jasmineDone(): void {
    const lockname = `${this.options.file}.lock`;

    this.output.stats.end = new Date();

    if (!acquireLock(lockname, 2000)) {
      console.error(
        `Jasmine bamboo reporter unable to acquire a file lock for ${lockname}`,
      );
      return;
    }
    // we can ensure that no other process will update the results causing a write-afte-read hazard.

    try {
      if (fs.existsSync(this.options.file)) {
        const raw = fs.readFileSync(this.options.file, { encoding: 'utf8' });
        const previous = JSON.parse(raw);
        this.mergeOutput(previous);
      }
      this.output.stats.duration = Math.floor(
        ((this.output.stats.end as Date).getTime() -
          (this.output.stats.start as Date).getTime()) /
          1000,
      );
      this.output.stats.time = this.output.stats.duration;
      const resultsOutput = this.options.beautify
        ? JSON.stringify(this.output, null, this.options.indentationLevel)
        : JSON.stringify(this.output);
      fs.writeFileSync(this.options.file, resultsOutput);
    } finally {
      try {
        releaseLock(lockname);
      } catch {
        console.error(
          `Jasmine bamboo reporter could not unlock file ${lockname}`,
        );
      }
    }
  }
}
