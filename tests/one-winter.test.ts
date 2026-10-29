import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// D-114: the Windows build shows One Winter, built from one page with the fonts bundled.
const root = new URL('../apps/desktop/', import.meta.url);
const game = readFileSync(new URL('one-winter/game.html', root), 'utf8');

describe('One Winter page', () => {
  it('loads no scripts from anywhere', () => {
    expect(game).not.toMatch(/<script[^>]+src=/);
  });

  it('has the rules numbers in one place', () => {
    expect(game).toContain('const N={');
  });

  it('builds the desktop renderer with local fonts and no Google link', () => {
    execFileSync(process.execPath, [new URL('scripts/copy-renderer.cjs', root).pathname]);
    const page = readFileSync(new URL('renderer/index.html', root), 'utf8');
    expect(page.startsWith('<!doctype html>')).toBe(true);
    expect(page).not.toContain('fonts.googleapis.com');
    expect(page).toContain('href="fonts/fonts.css"');
    for (const f of ['BarlowCondensed-500', 'BarlowCondensed-700', 'AtkinsonHyperlegible-400', 'AtkinsonHyperlegible-700']) {
      expect(existsSync(new URL(`renderer/fonts/${f}.woff2`, root))).toBe(true);
    }
  });
});
