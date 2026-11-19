// Bundles Sir's full rules (packages/core + content, through the Session) into rules.js,
// which game.html loads. Run: node apps/desktop/one-winter/src/build-rules.mjs
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const here = fileURLToPath(new URL('.', import.meta.url));
await build({
  entryPoints: [here + 'bridge.ts'], bundle: true, format: 'iife', target: 'es2020', minify: true,
  outfile: here + '../rules.js', logLevel: 'warning',
  define: { 'import.meta.env': '{"DEV":false,"PROD":true,"MODE":"production"}' },
});
