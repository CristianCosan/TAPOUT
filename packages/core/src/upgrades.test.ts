// The build path reads v12's own cost tables and changes nothing.

import { describe, expect, it } from 'vitest';
import { setPresenter, snapshotRun, startRun, upgradePath } from './game.ts';

setPresenter({ showModal: () => {}, hideModal: () => {}, typewriterInto: () => {} });

function start() {
  return startRun({ seed: 'up', kit: ['axe', 'saw', 'pot', 'bag', 'ferro', 'bow', 'line', 'wire', 'mace', 'multitool'], backstory: { who: 'partner', fear: 'failing' }, name: 'Dan', heightCm: 178, startWeightKg: 88, sex: 'man' });
}

describe('upgrade path', () => {
  it('lists every shelter tier with v12 costs, the next one first', () => {
    start();
    const path = upgradePath('shelter');
    expect(path.current).toBe(0);
    expect(path.steps.map((s) => [s.tier, s.sessions, s.energy, s.state])).toEqual([
      [1, 2, 12, 'next'],
      [2, 3, 22, 'later'],
      [3, 5, 24, 'later'],
    ]);
    expect(path.steps[2]!.needs).toEqual({ wood: 6, moss: 2, clay: 2, rocks: 3 });
  });

  it('follows progress and marks what is built', () => {
    const run = start();
    run.state.structure = 1;
    run.state.buildProg = 2;
    const path = upgradePath('shelter');
    expect(path.steps.map((s) => [s.state, s.done])).toEqual([['built', 2], ['next', 2], ['later', 0]]);
    expect(upgradePath('firepit').steps.map((s) => s.tier)).toEqual([1, 2]);
    expect(upgradePath('cache').steps).toHaveLength(3);
    expect(upgradePath('rack').steps.every((s) => s.sessions === 1)).toBe(true);
  });

  it('does not touch the run', () => {
    const run = start();
    const before = JSON.stringify(snapshotRun(run));
    for (const id of ['shelter', 'firepit', 'rack', 'cache'] as const) upgradePath(id);
    expect(JSON.stringify(snapshotRun(run))).toBe(before);
  });
});
