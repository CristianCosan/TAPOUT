// npm run notices: writes apps/game/src/legal/licences.txt (bundled into the Credits screen), the licence text of every library
// bundled into the game (MIT and similar licences ask for their notice to ship with the copy).
// Electron's own licences (LICENSE.electron.txt, LICENSES.chromium.html) are added to the
// Windows build by electron-builder. Run after changing dependencies; a test checks it is current.
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));

export function bundled() {
  const out = execSync('npm ls -w @tapout/game --omit=dev --all --parseable', { cwd: root, encoding: 'utf8' });
  return [...new Set(out.split('\n').filter((p) => p.includes(`node_modules${path.sep}`)))]
    .map((dir) => ({ dir, pkg: JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')) }))
    .filter(({ pkg }) => !pkg.name.startsWith('@tapout/'))
    .sort((a, b) => a.pkg.name.localeCompare(b.pkg.name));
}

export function noticesText() {
  const parts = bundled().map(({ dir, pkg }) => {
    const file = readdirSync(dir).find((f) => /^(licen[cs]e|copying)(\.(md|txt))?$/i.test(f));
    const text = file ? readFileSync(path.join(dir, file), 'utf8').trim() : `Licence: ${pkg.license ?? 'see package'}`;
    return `${'='.repeat(72)}\n${pkg.name} ${pkg.version} (${pkg.license ?? 'unknown'})\n${pkg.homepage ?? ''}\n${'='.repeat(72)}\n\n${text}\n`;
  });
  return `TAP / OUT uses these open-source libraries. Their licences follow.\n\n${parts.join('\n')}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const target = path.join(root, 'apps/game/src/legal/licences.txt');
  writeFileSync(target, noticesText());
  console.log('licences.txt:', bundled().map(({ pkg }) => `${pkg.name} ${pkg.version}`).join(', '));
  if (!existsSync(target)) process.exit(1);
}
