// Match the CJS declaration to the runtime shape produced by the tsup footer
// (`module.exports = Reporter`). tsup emits an ESM-style `export { Reporter as
// default }` for both formats; rewrite the CJS `dist/index.d.ts` to `export =
// Reporter` (with the options type merged into the namespace) so that
// `import Reporter = require('jasmine-bamboo-reporter')` is constructable.
// The ESM `dist/index.d.mts` keeps its default export untouched.
import { readFileSync, writeFileSync } from 'node:fs';

const dtsPath = 'dist/index.d.ts';
const source = readFileSync(dtsPath, 'utf8');
const rewritten = source.replace(
  /export\s*\{[^}]*Reporter as default[^}]*\};?/,
  'declare namespace Reporter {\n  export { ReporterOptions };\n}\nexport = Reporter;',
);

if (rewritten === source) {
  throw new Error('fix-cjs-dts: expected default export not found in dist/index.d.ts');
}

writeFileSync(dtsPath, rewritten);
