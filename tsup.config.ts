import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'es2022',
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  // The legacy API is a bare `module.exports = Reporter`; keep `require()` returning
  // the constructor directly instead of a `{ default }` namespace. The CJS `.d.ts`
  // is matched to that shape by scripts/fix-cjs-dts.mjs, run after tsup in `build`.
  footer: ({ format }) =>
    format === 'cjs' ? { js: 'module.exports = module.exports.default;' } : {},
});
