# jasmine-bamboo-reporter

[![Latest release on NPM](https://img.shields.io/npm/v/jasmine-bamboo-reporter.svg)](https://www.npmjs.com/package/jasmine-bamboo-reporter)
[![npm module downloads per month](http://img.shields.io/npm/dm/jasmine-bamboo-reporter.svg?style=flat)](https://www.npmjs.org/package/jasmine-bamboo-reporter)
[![Build states](https://github.com/voidberg/jasmine-bamboo-reporter/workflows/CI/badge.svg)](https://github.com/voidberg/jasmine-bamboo-reporter/actions?query=workflow%3A%22CI%22+branch%3Amain++)
[![MIT License](https://img.shields.io/npm/l/jasmine-bamboo-reporter.svg)](https://opensource.org/licenses/MIT)

## What is it?

A reporter for [Jasmine](https://jasmine.github.io/) that writes a JSON report compatible with Atlassian Bamboo's Mocha Test Parser, so Jasmine results show up in your Bamboo build. It also supports test sharding (several Jasmine processes writing the same report file); the reporter locks the file and merges each run into it, so a sharded run ends with a single combined report.

Written in TypeScript and shipped as dual ESM and CommonJS with type definitions.

## Installation

- `npm install --save-dev jasmine-bamboo-reporter`

Requires Node.js 20.9.0 or newer (see the `engines` field).

## Usage

Register the reporter with Jasmine from a helper file:

```typescript
import Reporter from 'jasmine-bamboo-reporter';

jasmine.getEnv().addReporter(
  new Reporter({
    file: 'jasmine-results.json', // by default it writes to jasmine.json
    beautify: true,
    indentationLevel: 4, // used when beautify is true
  }),
);
```

CommonJS works the same way:

```javascript
const Reporter = require('jasmine-bamboo-reporter');
```

### Options

| Option             | Default         | Description                                          |
| ------------------ | --------------- | ---------------------------------------------------- |
| `file`             | `jasmine.json`  | Path of the JSON report file to write.               |
| `beautify`         | `true`          | Pretty-print the JSON output.                        |
| `indentationLevel` | `4`             | Indentation width used when `beautify` is enabled.   |

### Parallel and sharded runs

When several Jasmine processes write to the same report file, the reporter locks the file and merges each run into it, so a sharded run still ends with a single combined report. This works with any setup that runs Jasmine across multiple processes, whether that is CI shards, a parallel runner such as WebdriverIO, or your own launcher.

Add the reporter in each process as shown above, and clear any stale report and lock file once before the run starts, not inside each process:

```javascript
const fs = require('node:fs');

if (fs.existsSync('jasmine-results.json.lock')) fs.unlinkSync('jasmine-results.json.lock');
if (fs.existsSync('jasmine-results.json')) fs.unlinkSync('jasmine-results.json');
```

## Example output

A run with one passing spec, one failing spec, and one skipped spec writes:

```json
{
  "stats": {
    "suites": 1,
    "tests": 3,
    "passes": 1,
    "pending": 1,
    "failures": 1,
    "start": "2026-01-01T12:00:00.000Z",
    "end": "2026-01-01T12:00:09.000Z",
    "duration": 9,
    "time": 9
  },
  "failures": [
    {
      "duration": 2,
      "time": 2,
      "title": "suite a should fail",
      "fullTitle": "should fail",
      "error": "1 Failure: 1. : Expected false to be truthy."
    }
  ],
  "passes": [
    {
      "duration": 1,
      "time": 1,
      "title": "suite a should pass",
      "fullTitle": "should pass"
    }
  ],
  "skipped": [
    {
      "duration": 0,
      "time": 0,
      "title": "suite a should pend",
      "fullTitle": "should pend"
    }
  ]
}
```

The `title` field holds Jasmine's full name and `fullTitle` holds the spec description; `time` mirrors `duration` because the Bamboo and Mocha tooling reads `time`.

## Development

```sh
git clone https://github.com/voidberg/jasmine-bamboo-reporter.git
cd jasmine-bamboo-reporter
npm install
```

- `npm test` runs the test suite (Vitest).
- `npm run typecheck` runs the TypeScript compiler with no emit.
- `npm run lint` runs Biome.
- `npm run build` builds the dual ESM/CJS bundle with tsup.

## License

[MIT](https://github.com/voidberg/jasmine-bamboo-reporter/blob/main/LICENSE)
