// rc.4 (stepBuilds): camp builds as named steps. v12 builds each tier in whole sessions; TAP / OUT
// splits a tier into steps, each one sitting with an even share of the tier's v12 energy, hours and
// materials, so a finished tier costs exactly what it did in v12. With the flag off every helper
// here answers in v12's sessions, and the actions behave as v12.

import { RULES } from './rules.ts';
import { S } from './state.ts';
import { BUILD_HOURS, BUILD_NEED, BUILD_STEPS, CACHE_COST, CACHE_NEED, DUGOUT_COST, DUGOUT_NEED, DUGOUT_STAGES, FIREPIT_COST, FIREPIT_NEED, RACK_COST, SHELTER_COST } from './tuning.ts';

export type BuildId = 'shelter' | 'dugout' | 'firepit' | 'rack' | 'cache';
export interface StepCost { e: number; h: number; wood?: number; moss?: number; clay?: number; rocks?: number; stage?: string }

/** The tier indices each build climbs through, in order (the index its v12 cost tables use). */
export function buildTiers(id: BuildId): number[] {
  switch (id) {
    case 'shelter': return [0, 1, 2];
    case 'dugout': return RULES.dugoutStages ? [0, 1, 2] : [0];
    case 'firepit': return [1, 2];
    case 'rack': return [1, 2];
    case 'cache': return [1, 2, 3];
  }
}

/** v12's sessions for one tier, each with its own cost (rc.4 realTimes: with realistic hours). */
function tierSessions(id: BuildId, t: number): StepCost[] {
  const h = RULES.realTimes ? BUILD_HOURS[id]?.[t] : undefined;
  const v12 = v12Sessions(id, t);
  return h === undefined ? v12 : v12.map((c) => ({ ...c, h }));
}
function v12Sessions(id: BuildId, t: number): StepCost[] {
  const many = (n: number, c: StepCost) => Array.from({ length: n }, () => c);
  switch (id) {
    case 'shelter': return many(BUILD_NEED[t], SHELTER_COST[t]);
    case 'firepit': return many(FIREPIT_NEED[t], FIREPIT_COST[t]);
    case 'rack': return [RACK_COST[t]];
    case 'cache': return many(CACHE_NEED[t], CACHE_COST[t]);
    case 'dugout': {
      if (!RULES.dugoutStages) return many(DUGOUT_NEED, DUGOUT_COST);
      const stages = ['dig', 'walls', 'roof'];
      return (DUGOUT_STAGES as StepCost[]).filter((c) => c.stage === stages[t]);
    }
  }
}

/** How many steps tier t is built in. */
export function tierSteps(id: BuildId, t: number): number {
  return RULES.stepBuilds ? BUILD_STEPS[id][t] : tierSessions(id, t).length;
}

/** What step k (from 0) of tier t costs. */
export function stepCost(id: BuildId, t: number, k: number): StepCost {
  const sessions = tierSessions(id, t);
  if (!RULES.stepBuilds) return sessions[k] ?? sessions[0]!;
  const steps = tierSteps(id, t);
  const out: StepCost = { e: 0, h: 0, stage: sessions[0]!.stage };
  for (const key of ['e', 'h', 'wood', 'moss', 'clay', 'rocks'] as const) {
    const total = sessions.reduce((a, c) => a + (c[key] || 0), 0);
    // A material the tier never uses stays absent; one it uses keeps a number, even 0.
    if (!total) { if (key in sessions[0]!) out[key] = 0; continue; }
    if (key === 'h') { out.h = total / steps; continue; }
    // Whole units, the remainder on the first steps.
    const base = Math.floor(total / steps);
    out[key] = base + (k < total - base * steps ? 1 : 0);
  }
  return out;
}

/** All the dugout's steps, end to end. */
export function dugoutTotal(): number {
  return RULES.stepBuilds || RULES.dugoutStages ? buildTiers('dugout').reduce((a, t) => a + tierSteps('dugout', t), 0) : DUGOUT_NEED;
}

/** The dugout's overall step count, as the tier being dug and the step within it. */
export function dugoutAt(prog: number): { t: number; k: number } {
  let left = prog;
  for (const t of buildTiers('dugout')) {
    const n = tierSteps('dugout', t);
    if (left < n) return { t, k: left };
    left -= n;
  }
  const tiers = buildTiers('dugout');
  return { t: tiers[tiers.length - 1]!, k: tierSteps('dugout', tiers[tiers.length - 1]!) };
}

/** Where a build stands: tiers finished, and steps done towards the next one. */
export function buildState(id: BuildId): { done: number; k: number } {
  switch (id) {
    case 'shelter': return { done: S.structure, k: S.buildProg };
    case 'firepit': return { done: S.firepitTier, k: S.firepitProg };
    case 'rack': return { done: S.rackTier, k: S.rackProg || 0 };
    case 'cache': return { done: S.cacheTier, k: S.cacheProg };
    case 'dugout': {
      if (S.dugout) return { done: buildTiers('dugout').length, k: 0 };
      const at = dugoutAt(S.dugoutProg);
      return { done: buildTiers('dugout').indexOf(at.t), k: at.k };
    }
  }
}
