import { describe, expect, it } from 'vitest';
import { loadLegacyGame } from './legacy-game.ts';

describe('legacy v12 in Node', () => {
  it('starts a run', () => {
    const game = loadLegacyGame({ seed: 'parity-1' });
    expect(game.state.day).toBe(1);
    expect(game.state.rivals).toBe(9);
    expect(game.read('TUNING.energy.startArrival')).toBe(180);
  });

  it('is deterministic for a seed', () => {
    const a = loadLegacyGame({ seed: 'parity-1' });
    const b = loadLegacyGame({ seed: 'parity-1' });
    expect(a.snapshot()).toEqual(b.snapshot());
  });

  it('differs between seeds', () => {
    const a = loadLegacyGame({ seed: 'seed-a' });
    const b = loadLegacyGame({ seed: 'seed-b' });
    expect(a.snapshot()).not.toEqual(b.snapshot());
  });
});
