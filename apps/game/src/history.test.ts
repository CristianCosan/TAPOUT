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
