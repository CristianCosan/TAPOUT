// What each camp build becomes next, read straight off v12's cost tables (rc.2: Sir wants the
// whole path on click). Read-only: it describes the run and decides nothing.

import { S } from './v12/state.ts';
import { eCost, eTime } from './v12/cost.ts';
import { BUILD_NEED, CACHE_COST, CACHE_NEED, FIREPIT_COST, FIREPIT_NEED, RACK_COST, SHELTER_COST } from './v12/tuning.ts';

export type UpgradeId = 'shelter' | 'firepit' | 'rack' | 'cache';
export type Material = 'wood' | 'moss' | 'clay' | 'rocks';

export interface UpgradeStep {
  /** The tier this step builds, 1 = the first thing you build. */
  tier: number;
  /** Building sessions it takes, and how many are done. */
  sessions: number;
  done: number;
  /** Per session: energy and hours as they stand today (winter, injuries and shivering included). */
  energy: number;
  hours: number;
  needs: Partial<Record<Material, number>>;
  state: 'built' | 'next' | 'later';
}

export interface UpgradePath {
  id: UpgradeId;
  /** The tier you have now, 0 = nothing built. */
  current: number;
  steps: UpgradeStep[];
}

interface Cost { e: number; h: number; wood?: number; moss?: number; clay?: number; rocks?: number }

function steps(costs: Array<Cost | null>, need: Array<number | null>, current: number, progress: number, first: number): UpgradeStep[] {
  const out: UpgradeStep[] = [];
  costs.forEach((c, i) => {
    if (!c) return;
    const tier = i + first;
    const sessions = need[i] ?? 1;
    const needs: Partial<Record<Material, number>> = {};
    for (const m of ['wood', 'moss', 'clay', 'rocks'] as const) if (c[m]) needs[m] = c[m];
    const state = tier <= current ? 'built' : tier === current + 1 ? 'next' : 'later';
    out.push({
      tier,
      sessions,
      done: state === 'built' ? sessions : state === 'next' ? progress : 0,
      energy: eCost(c.e, 'ohw'),
      hours: eTime(c.h, 'ohw'),
      needs,
      state,
    });
  });
  return out;
}

export function upgradePath(id: UpgradeId): UpgradePath {
  switch (id) {
    case 'shelter':
      return { id, current: S.structure, steps: steps(SHELTER_COST, BUILD_NEED, S.structure, S.buildProg, 1) };
    case 'firepit':
      return { id, current: S.firepitTier, steps: steps(FIREPIT_COST, FIREPIT_NEED, S.firepitTier, S.firepitProg, 0) };
    case 'rack':
      return { id, current: S.rackTier, steps: steps(RACK_COST, RACK_COST.map(() => 1), S.rackTier, 0, 0) };
    case 'cache':
      return { id, current: S.cacheTier, steps: steps(CACHE_COST, CACHE_NEED, S.cacheTier, S.cacheProg, 0) };
  }
}
