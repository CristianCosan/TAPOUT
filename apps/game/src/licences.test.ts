import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('open-source licences', () => {
  it('lists every library the game ships (run npm run notices after changing dependencies)', () => {
    const text = readFileSync(new URL('./legal/licences.txt', import.meta.url), 'utf8');
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { dependencies: Record<string, string> };
    for (const name of Object.keys(pkg.dependencies).filter((n) => !n.startsWith('@tapout/'))) {
      const installed = JSON.parse(readFileSync(new URL(`../../../node_modules/${name}/package.json`, import.meta.url), 'utf8')) as { version: string };
      expect(text).toContain(`\n${name} ${installed.version} (`);
    }
    expect(text).toContain('Permission is hereby granted');
  });
});
