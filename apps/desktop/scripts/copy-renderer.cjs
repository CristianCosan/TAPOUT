// Builds the renderer the Electron window loads: One Winter (D-114), one HTML page.
// one-winter/game.html is the same page as the browser build; here it gets a document
// skeleton and the two fonts from one-winter/fonts instead of Google Fonts, so it runs offline.
const fs = require('node:fs');
const path = require('node:path');

const source = path.resolve(__dirname, '../one-winter');
const target = path.resolve(__dirname, '../renderer');
const game = fs.readFileSync(path.join(source, 'game.html'), 'utf8');
const fontLink = /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/;
if (!fontLink.test(game)) {
  console.error('one-winter/game.html: the Google Fonts link was not found.');
  process.exit(1);
}
const version = require('../package.json').version;
if (!game.includes(`const VERSION='${version}';`)) {
  console.error(`one-winter/game.html: VERSION does not match ${version}.`);
  process.exit(1);
}
const page = [
  '<!doctype html>',
  '<html lang="en"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<link rel="stylesheet" href="fonts/fonts.css">',
  '<style>html,body{margin:0;height:100%;background:#121618}img{max-width:100%}[hidden]{display:none!important}</style>',
  '</head><body>',
  game.replace(fontLink, ''),
  '</body></html>',
  '',
].join('\n');
fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(path.join(target, 'fonts'), { recursive: true });
fs.writeFileSync(path.join(target, 'index.html'), page);
for (const f of fs.readdirSync(path.join(source, 'fonts'))) {
  fs.copyFileSync(path.join(source, 'fonts', f), path.join(target, 'fonts', f));
}
console.log('renderer built from one-winter/game.html');
