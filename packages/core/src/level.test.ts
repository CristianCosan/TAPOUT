// Intended difference (D-136): harder levels after a win. With no level set, nothing changes.
import { describe, expect, it } from 'vitest';
import { ambientTempC, setPresenter, snapshotRun, restoreRun, startRun } from './game.ts';
import { levelCatch, levelDawn, levelTempC } from './v12/level.ts';

setPresenter({ showModal: () => {}, hideModal: () => {}, typewriterInto: () => {} });
const kit = ['axe', 'saw', 'pot', 'bag', 'ferro', 'bow', 'line', 'wire', 'mace', 'multitool'];
const start = () => startRun({ seed: 'lv', kit, backstory: { who: 'partner', fear: 'failing' }, name: 'Dan', heightCm: 178, startWeightKg: 88, sex: 'man' });

describe('harder levels', () => {
  it('change nothing on a normal run', () => {
    const run = start();
    expect(run.state.level).toBeUndefined();
    expect(levelTempC()).toBe(0);
    expect(levelCatch(0.3, 'fish')).toBe(0.3);
    const m = run.state.morale; levelDawn(); expect(run.state.morale).toBe(m);
  });
  it('make the air colder, catches leaner and dawns heavier when set', () => {
    const run = start();
    const t0 = ambientTempC(false);
    run.state.level = { temp: -5, fish: -0.08, snare: 0.06, nightMorale: 3 };
    expect(ambientTempC(false)).toBe(t0 - 5);
    expect(levelCatch(0.3, 'fish')).toBeCloseTo(0.22);
    expect(levelCatch(0.05, 'fish')).toBe(0);
    expect(levelCatch(0.88, 'snare')).toBe(0.9);
    run.state.morale = 50; levelDawn(); expect(run.state.morale).toBe(47);
  });
  it('a mild winter is warm early and cold late', () => {
    const run = start();
    run.state.level = { mild: true };
    run.state.day = 3; expect(levelTempC()).toBe(4);
    run.state.day = 9; expect(levelTempC()).toBe(0);
    run.state.day = 14; expect(levelTempC()).toBe(-3);
  });
  it('survives a save', () => {
    const run = start();
    run.state.level = { temp: -3, name: 'Season 2' };
    expect(restoreRun(snapshotRun(run)).state.level).toEqual({ temp: -3, name: 'Season 2' });
  });
});
