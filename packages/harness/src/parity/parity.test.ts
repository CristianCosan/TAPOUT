import { describe, expect, it } from 'vitest';
import { playDays } from '../legacy/script-run.ts';
import { runParity } from './parity.ts';

describe('port vs v12', () => {
  it('starts every run identically', () => {
    for (const seed of ['p1', 'p2', 'p3', 42, 7]) {
      expect(runParity({ seed }, []).divergence).toBeNull();
    }
  });

  it('plays three scripted days identically', () => {
    const script = playDays({ seed: 'parity-days' }, 3).script;
    const result = runParity({ seed: 'parity-days' }, script);
    expect(result.divergence).toBeNull();
    expect(result.steps).toBe(script.length);
  });
});

describe('port vs v12, played by bots', () => {
  it('stays identical through whole runs, modals and all', async () => {
    const { runLockstep } = await import('./lockstep.ts');
    for (const seed of ['ci-1', 'ci-2', 'ci-3']) {
      for (const persona of ['random', 'survivor'] as const) {
        const result = runLockstep({ seed }, { days: 30, persona, tapOutChance: 0.002, resumeEvery: 7 });
        expect(result.divergence, `${seed}/${persona}`).toBeNull();
        expect(result.decisions.length).toBeGreaterThan(50);
      }
    }
  }, 60_000);
});
