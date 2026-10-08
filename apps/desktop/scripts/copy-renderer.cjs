// Copies the built game (apps/game/dist) next to the Electron main process.
const fs = require('node:fs');
const path = require('node:path');

const source = path.resolve(__dirname, '../../game/dist');
const target = path.resolve(__dirname, '../renderer');
if (!fs.existsSync(path.join(source, 'index.html'))) {
  console.error('apps/game/dist is missing. Run "npm run build" at the repo root first.');
  process.exit(1);
}
fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });
console.log('renderer copied');
