// Puts src/full.js into game.html between its markers (or before the start section the first time),
// and makes sure the page loads rules.js first. Run after editing full.js:
//   node apps/desktop/one-winter/src/splice.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const page = join(here, '..', 'game.html');
let html = readFileSync(page, 'utf8');
const full = readFileSync(join(here, 'full.js'), 'utf8').trim();
const BEGIN = '/*FULL-BEGIN*/';
const END = '/*FULL-END*/';
const body = full.replace(END, '').trim();
const block = `${BEGIN}\n${body}\n${END}\n`;

if (html.includes(BEGIN)) {
  const a = html.indexOf(BEGIN);
  const b = html.indexOf(END) + END.length + 1;
  html = html.slice(0, a) + block + html.slice(b);
} else {
  const at = html.indexOf('// ---------- start ----------');
  if (at < 0) throw new Error('start marker not found');
  html = html.slice(0, at) + block + html.slice(at);
}
if (!html.includes('<script src="rules.js"></script>')) {
  html = html.replace('<script>\n(function(){', '<script src="rules.js"></script>\n<script>\n(function(){');
}
writeFileSync(page, html);
console.log('spliced', body.length, 'chars');
