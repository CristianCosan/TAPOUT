import { describe, expect, it } from 'vitest';
import { RUN_KEY, SaveStore, checksum } from './saves.ts';

class MemoryStorage {
  data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

function store() {
  const storage = new MemoryStorage();
  return { storage, saves: new SaveStore<{ step: number }>(storage as unknown as Storage, 'test') };
}

describe('the run save (plan §10, §12 save suite)', () => {
  it('round-trips and keeps three rotating backups and a dawn copy', () => {
    const { storage, saves } = store();
    for (let step = 1; step <= 5; step++) saves.write({ step }, 1, 't');
    expect(saves.read()).toEqual({ body: { step: 5 }, source: 'save' });
    expect(JSON.parse(storage.getItem('tapout.run.bak1')!).body.step).toBe(4);
    expect(JSON.parse(storage.getItem('tapout.run.bak3')!).body.step).toBe(2);
    expect(JSON.parse(storage.getItem('tapout.run.dawn')!).body.step).toBe(1);
  });

  it('falls back to the newest intact backup when the save is truncated', () => {
    const { storage, saves } = store();
    for (let step = 1; step <= 3; step++) saves.write({ step }, 1, 't');
    storage.setItem(RUN_KEY, storage.getItem(RUN_KEY)!.slice(0, 30));
    expect(saves.read()).toEqual({ body: { step: 2 }, source: 'backup1' });
  });

  it('rejects a save whose checksum does not match', () => {
    const { storage, saves } = store();
    saves.write({ step: 1 }, 1, 't');
    saves.write({ step: 2 }, 1, 't');
    storage.setItem(RUN_KEY, storage.getItem(RUN_KEY)!.replace('"step":2', '"step":9'));
    expect(saves.read()).toEqual({ body: { step: 1 }, source: 'backup1' });
  });

  it('goes back to this morning when every backup is damaged', () => {
    const { storage, saves } = store();
    saves.write({ step: 1 }, 1, 't');
    for (let step = 2; step <= 6; step++) saves.write({ step }, 2, 't');
    for (const key of [RUN_KEY, 'tapout.run.bak1', 'tapout.run.bak2', 'tapout.run.bak3']) storage.setItem(key, '{oops');
    expect(saves.read()).toEqual({ body: { step: 2 }, source: 'dawn' });
  });

  it('never rotates a damaged save into the backups', () => {
    const { storage, saves } = store();
    saves.write({ step: 1 }, 1, 't');
    saves.write({ step: 2 }, 1, 't');
    storage.setItem(RUN_KEY, 'garbage');
    saves.write({ step: 3 }, 1, 't');
    expect(JSON.parse(storage.getItem('tapout.run.bak1')!).body.step).toBe(1);
    expect(storage.getItem('tapout.run.bak2')).toBeNull();
  });

  it('clears everything when the run ends', () => {
    const { storage, saves } = store();
    saves.write({ step: 1 }, 1, 't');
    saves.write({ step: 2 }, 1, 't');
    saves.clear();
    expect(storage.length).toBe(0);
    expect(saves.read()).toBeNull();
  });

  it('checksums are stable and sensitive', () => {
    expect(checksum('{"a":1}')).toBe(checksum('{"a":1}'));
    expect(checksum('{"a":1}')).not.toBe(checksum('{"a":2}'));
  });
});
