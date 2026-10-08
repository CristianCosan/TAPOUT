import { describe, expect, it } from 'vitest';
import { createRngState, hashSeed, nextFloat, randomFn } from './rng.ts';

describe('seeded rng', () => {
  it('repeats the same stream for the same seed', () => {
    const a = createRngState('run-1');
    const b = createRngState('run-1');
    const drawsA = Array.from({ length: 100 }, () => nextFloat(a));
    const drawsB = Array.from({ length: 100 }, () => nextFloat(b));
    expect(drawsA).toEqual(drawsB);
    expect(a.draws).toBe(100);
  });

  it('stays inside [0, 1)', () => {
    const rand = randomFn(createRngState(42));
    for (let i = 0; i < 10_000; i += 1) {
      const x = rand();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('never uses a zero seed', () => {
    expect(hashSeed(0)).not.toBe(0);
  });

  it('resumes exactly from a serialized state', () => {
    const live = createRngState(7);
    for (let i = 0; i < 10; i += 1) nextFloat(live);
    const restored = JSON.parse(JSON.stringify(live));
    expect(nextFloat(restored)).toBe(nextFloat(live));
  });
});
