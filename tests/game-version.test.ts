import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GAME_VERSION } from '../packages/content/src/build.ts';

// The title screen and every save carry GAME_VERSION; the Windows build is named after package.json.
describe('GAME_VERSION', () => {
  it('matches the version the Windows build is named after', () => {
    for (const file of ['package.json', 'apps/desktop/package.json']) {
      const pkg = JSON.parse(readFileSync(file, 'utf8')) as { version: string };
      expect(pkg.version).toBe(GAME_VERSION);
    }
  });
});
