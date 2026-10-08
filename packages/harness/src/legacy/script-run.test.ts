import { describe, expect, it } from 'vitest';
import { playDays } from './script-run.ts';

describe('scripted legacy run', () => {
  it('plays three full days', () => {
    const result = playDays({ seed: 'script-1' }, 3);
    const last = result.steps.at(-1)!;
    expect(last.day).toBeGreaterThan(3);
    expect(result.steps.filter((s) => s.label.startsWith('sleep'))).toHaveLength(3);
  });

  it('produces identical snapshots on a rerun', () => {
    const a = playDays({ seed: 'script-1' }, 3);
    const b = playDays({ seed: 'script-1' }, 3);
    expect(b.steps.map((s) => s.state)).toEqual(a.steps.map((s) => s.state));
    expect(b.steps.at(-1)!.draws).toBe(a.steps.at(-1)!.draws);
  });
});
