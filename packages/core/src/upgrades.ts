// What each camp build becomes next, read straight off v12's cost tables (rc.2: Sir wants the
// whole path on click). Read-only: it describes the run and decides nothing. rc.4: the path is a
// list of steps (stepBuilds), grouped by the tier each one leads to.

import { S } from './v12/state.ts';
import { eCost, eTime } from './v12/cost.ts';
import { buildState, buildTiers, stepCost, tierSteps, type BuildId } from './v12/builds.ts';
import { builtToday, routeClosed } from './v12/camp.ts';

export type UpgradeId = BuildId;
export type Material = 'wood' | 'moss' | 'clay' | 'rocks';

export interface UpgradeStep {
  /** The tier this step leads to, 1 = the first thing you build. */
  tier: number;
  /** Its place along the whole path, from 1. */
  step: number;
  /** Its place within its tier, from 1, and how many steps the tier has. */
  of: number;
  within: number;
  /** Per step: energy and hours as they stand today (winter, injuries and shivering included). */
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
  /** Steps done along the whole path. */
  done: number;
  /** rc.4 (oneRoute): the other way to a bed was chosen, so this one is shut for the run. */
  closed?: boolean;
  /** rc.4 (buildPace): worked on today already; it can go on tomorrow. */
  settling?: boolean;
}

export function upgradePath(id: UpgradeId): UpgradePath {
  const at = buildState(id);
  const steps: UpgradeStep[] = [];
  let done = 0;
  buildTiers(id).forEach((t, i) => {
    const tier = i + 1;
    const of = tierSteps(id, t);
    for (let k = 0; k < of; k++) {
      const c = stepCost(id, t, k);
      const needs: Partial<Record<Material, number>> = {};
      for (const m of ['wood', 'moss', 'clay', 'rocks'] as const) if (c[m]) needs[m] = c[m];
      const built = tier <= at.done || (tier === at.done + 1 && k < at.k);
      const state = built ? 'built' : tier === at.done + 1 && k === at.k ? 'next' : 'later';
      if (built) done++;
      steps.push({ tier, step: steps.length + 1, of, within: k + 1, energy: eCost(c.e, 'ohw'), hours: eTime(c.h, 'ohw'), needs, state });
    }
  });
  const path: UpgradePath = { id, current: at.done, steps, done };
  if (id === 'shelter' || id === 'dugout') path.closed = routeClosed(id);
  // The lean-to goes up in one go; every later session needs a night between.
  path.settling = builtToday(id) && !(id === 'shelter' && S.structure === 0);
  return path;
}
