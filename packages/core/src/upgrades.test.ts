// The build path reads v12's own cost tables and changes nothing.

import { describe, expect, it } from 'vitest';
import { setPresenter, snapshotRun, startRun, upgradePath } from './game.ts';

setPresenter({ showModal: () => {}, hideModal: () => {}, typewriterInto: () => {} });

function start() {
  return startRun({ seed: 'up', kit: ['axe', 'saw', 'pot', 'bag', 'ferro', 'bow', 'line', 'wire', 'mace', 'multitool'], backstory: { who: 'partner', fear: 'failing' }, name: 'Dan', heightCm: 178, startWeightKg: 88, sex: 'man' });
}

describe('upgrade path', () => {
  it('lists every shelter step with v12 costs, the next one first (rc.4: steps)', () => {
    start();
    const path = upgradePath('shelter');
    expect(path.current).toBe(0);
    expect(path.steps).toHaveLength(10);
    expect(path.steps.map((s) => s.tier)).toEqual([1, 1, 2, 2, 2, 3, 3, 3, 3, 3]);
    expect(path.steps[0]!.state).toBe('next');
    expect(path.steps[0]!.energy).toBe(12);
    expect(path.steps[2]!.energy).toBe(22);
    expect(path.steps[9]!.needs).toEqual({ wood: 6, moss: 2, clay: 2, rocks: 3 });
  });

  it('follows progress and marks what is built', () => {
    const run = start();
    run.state.structure = 1;
    run.state.buildProg = 2;
    const path = upgradePath('shelter');
    expect(path.steps.map((s) => s.state)).toEqual(['built', 'built', 'built', 'built', 'next', 'later', 'later', 'later', 'later', 'later']);
    expect(path.done).toBe(4);
    expect(upgradePath('firepit').steps.map((s) => s.tier)).toEqual([1, 1, 2, 2, 2]);
    expect(upgradePath('cache').steps).toHaveLength(7);
    expect(upgradePath('rack').steps).toHaveLength(5);
  });

  it('shares a tier out across its steps without changing the total', () => {
    start();
    const rack = upgradePath('rack').steps.filter((s) => s.tier === 1);
    expect(rack.reduce((a, s) => a + (s.needs.wood ?? 0), 0)).toBe(4);
    const pit = upgradePath('firepit').steps.filter((s) => s.tier === 2);
    expect(pit.reduce((a, s) => a + (s.needs.clay ?? 0), 0)).toBe(6);
    expect(pit.reduce((a, s) => a + (s.needs.rocks ?? 0), 0)).toBe(8);
  });

  it('does not touch the run', () => {
    const run = start();
    const before = JSON.stringify(snapshotRun(run));
    for (const id of ['shelter', 'dugout', 'firepit', 'rack', 'cache'] as const) upgradePath(id);
    expect(JSON.stringify(snapshotRun(run))).toBe(before);
  });

  it('digs the dugout in three steps, then walls and roof (rc.3, rc.4)', () => {
    const run = start();
    let path = upgradePath('dugout');
    expect(path.steps.map((s) => [s.tier, s.needs, s.state])).toEqual([
      [1, {}, 'next'],
      [1, {}, 'later'],
      [1, {}, 'later'],
      [2, { wood: 4, moss: 2 }, 'later'],
      [3, { wood: 4, moss: 2 }, 'later'],
    ]);
    run.state.dugoutProg = 1;
    expect(upgradePath('dugout').steps[1]!.state).toBe('next');
    run.state.dugoutProg = 4;
    path = upgradePath('dugout');
    expect(path.current).toBe(2);
    expect(path.steps.map((s) => s.state)).toEqual(['built', 'built', 'built', 'built', 'next']);
  });
});
