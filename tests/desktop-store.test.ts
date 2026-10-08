import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

interface Store {
  fileFor(key: string): string | null;
  get(key: string): string | null;
  set(key: string, value: string): boolean;
  remove(key: string): boolean;
}
const { createStore } = createRequire(import.meta.url)('../apps/desktop/store.cjs') as { createStore: (root: string) => Store };

const roots: string[] = [];
function fresh(): { root: string; store: Store } {
  const root = mkdtempSync(join(tmpdir(), 'tapout-store-'));
  roots.push(root);
  return { root, store: createStore(root) };
}
afterEach(() => roots.splice(0).forEach((r) => rmSync(r, { recursive: true, force: true })));

describe('desktop save files (plan §10.2)', () => {
  it('puts run saves under saves\\ and history in profile.json', () => {
    const { root, store } = fresh();
    expect(store.fileFor('tapout.run')).toBe(join(root, 'saves', 'run.json'));
    expect(store.fileFor('tapout.run.bak2')).toBe(join(root, 'saves', 'run.bak2.json'));
    expect(store.fileFor('tapout.history')).toBe(join(root, 'profile.json'));
  });

  it('writes, reads back and removes, leaving no temporary file', () => {
    const { root, store } = fresh();
    expect(store.get('tapout.run')).toBeNull();
    expect(store.set('tapout.run', '{"a":1}')).toBe(true);
    expect(store.get('tapout.run')).toBe('{"a":1}');
    expect(readdirSync(join(root, 'saves'))).toEqual(['run.json']);
    expect(readFileSync(join(root, 'saves', 'run.json'), 'utf8')).toBe('{"a":1}');
    store.remove('tapout.run');
    expect(store.get('tapout.run')).toBeNull();
  });

  it('refuses keys that could reach outside the folder', () => {
    const { store } = fresh();
    for (const key of ['../evil', 'tapout../../x', 'tapout.run/../../x', 'other.run']) {
      expect(store.fileFor(key)).toBeNull();
      expect(store.set(key, 'x')).toBe(false);
    }
  });
});
