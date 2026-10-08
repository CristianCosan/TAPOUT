import { describe, expect, it } from 'vitest';
import { BUTTONS } from '@tapout/core';
import { LOCATIONS, SAFE, type LocationId } from './index.ts';

const ids = Object.keys(LOCATIONS) as LocationId[];

describe('location layouts', () => {
  for (const id of ids) {
    const layout = LOCATIONS[id];
    it(`${id}: every v12 action offered here has a station`, () => {
      const placed = new Set(layout.stations.flatMap((s) => s.actions));
      const missing = BUTTONS
        .filter((b) => b.loc === id || b.loc === 'all')
        .map((b) => b.id)
        .filter((a) => !placed.has(a));
      expect(missing).toEqual([]);
    });

    it(`${id}: actions belong here`, () => {
      const here = new Set(BUTTONS.filter((b) => b.loc === id || b.loc === 'all').map((b) => b.id));
      const stray = layout.stations.flatMap((s) => s.actions).filter((a) => !here.has(a));
      expect(stray).toEqual([]);
    });

    it(`${id}: station ids are unique and every hotspot sits inside the safe area`, () => {
      const stationIds = layout.stations.map((s) => s.id);
      expect(new Set(stationIds).size).toBe(stationIds.length);
      for (const s of layout.stations) {
        for (const p of s.hotspot) {
          expect(p.x, `${s.id} x`).toBeGreaterThanOrEqual(SAFE.left - 40);
          expect(p.x, `${s.id} x`).toBeLessThanOrEqual(SAFE.right + 40);
          expect(p.y, `${s.id} y`).toBeGreaterThanOrEqual(SAFE.top);
          expect(p.y, `${s.id} y`).toBeLessThanOrEqual(SAFE.bottom + 10);
        }
      }
    });

    it(`${id}: exits lead to the other two locations`, () => {
      const exits = layout.stations.filter((s) => s.exitTo).map((s) => s.exitTo).sort();
      expect(exits).toEqual(ids.filter((other) => other !== id).sort());
    });
  }
});
