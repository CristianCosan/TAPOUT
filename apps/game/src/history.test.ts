import { describe, expect, it } from 'vitest';
import { Session, type View } from './session.ts';

class MemoryStorage {
  private data = new Map<string, string>();
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

describe('run history', () => {
  it('records a finished run once and deletes its save', () => {
    const session = new Session(new MemoryStorage() as unknown as Storage);
    session.newRun(['axe', 'saw', 'ferro', 'pot', 'knife', 'sleeping', 'tarp', 'line', 'snare', 'bow'], 'history');
    expect(session.hasSave()).toBe(true);
    session.click('confirmTapOut()');
    session.click('confirmTapOutStep2()');
    session.click("hideModal(); endGame('tap')");
    // The ending plays as a sequence of modals; take the first button until the end screen.
    for (let i = 0; i < 40 && !(session.getView() as View).endScreen; i++) {
      const modal = (session.getView() as View).modal ?? '';
      const handler = /<button[^>]*onclick="([^"]*)"/.exec(modal)?.[1];
      if (!handler) break;
      session.click(handler.replace(/&quot;/g, '"'));
    }
    expect((session.getView() as View).endScreen).toBe(true);
    session.click('toggleEndStats()');
    expect(session.history()).toHaveLength(1);
    expect(session.history()[0]).toMatchObject({ day: 1 });
    expect(session.hasSave()).toBe(false);
  });
});

describe('saves through the session', () => {
  const kit = ['axe', 'saw', 'ferro', 'pot', 'knife', 'sleeping', 'tarp', 'line', 'snare', 'bow'];

  it('continues from a backup when the save is damaged, and says so', () => {
    const storage = new MemoryStorage() as unknown as Storage;
    const first = new Session(storage);
    first.newRun(kit, 'restore');
    first.click("goTo('shore')");
    while ((first.getView() as View).modal) first.click('hideModal()');
    storage.setItem('tapout.run', '{"format":"tapout-save"');
    const second = new Session(storage);
    expect(second.continueRun()).toBe(true);
    const view = second.getView() as View;
    expect(view.state.loc).toBe('camp');
    expect(view.result?.lines[0]?.msg).toMatch(/went back one step/);
  });

  it('archives an abandoned run as "Left the field"', () => {
    const storage = new MemoryStorage() as unknown as Storage;
    const session = new Session(storage);
    session.newRun(kit, 'abandon');
    session.leaveRun();
    session.abandonRun();
    expect(session.hasSave()).toBe(false);
    expect(session.history()[0]).toMatchObject({ title: 'Left the field', day: 1 });
  });

  it('reads a save written by build 0.0.2', () => {
    const storage = new MemoryStorage() as unknown as Storage;
    const writer = new Session(storage);
    writer.newRun(kit, 'legacy');
    // Rewrite the current save in the 0.0.2 shape: the body fields at the top level, version 1.
    const envelope = JSON.parse(storage.getItem('tapout.run')!) as { body: object };
    storage.setItem('tapout.run', JSON.stringify({ format: 'tapout-save', version: 1, savedAt: 't', ...envelope.body }));
    const reader = new Session(storage);
    expect(reader.continueRun()).toBe(true);
    expect((reader.getView() as View).state.day).toBe(1);
  });
});
