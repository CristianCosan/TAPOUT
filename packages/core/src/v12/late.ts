// rc.6 (lateUpgrades, Sir: "after day 20 or so there can even appear new upgrades"). Not in v12.
// Three ideas come to you late in the run, one at a time, on nights after day 20: a reflector
// wall behind the fire, birch-bark shingles on the roof, and (once there is snow) a snow wall
// round the shelter. Each is a single job with a real, small effect.

import { rand } from './runtime.ts';
import { log } from './setup.ts';
import { RULES } from './rules.ts';
import { S } from './state.ts';
import { afterAction, spend } from './threads.ts';
import { LATE_UPGRADES } from './tuning.ts';
import { sfxBuild } from './ui.ts';

export type LateId = 'reflector' | 'shingles' | 'snowWall';
const ORDER: LateId[] = ['reflector', 'shingles', 'snowWall'];

export function lateKnown(id: LateId): boolean {
  return RULES.lateUpgrades && !!S.lateKnown?.includes(id);
}
export function lateBuilt(id: LateId): boolean {
  return RULES.lateUpgrades && !!S.lateBuilt?.includes(id);
}

/** At dawn after day 20: now and then, the next idea. The snow wall waits for winter. */
export function lateTick(notes: string[]){
  if (!RULES.lateUpgrades || S.day < LATE_UPGRADES.fromDay) return;
  const known: LateId[] = S.lateKnown ?? [];
  const next = ORDER.find((id) => !known.includes(id) && (id !== 'snowWall' || S.winter));
  if (!next || rand() >= LATE_UPGRADES.chance) return;
  S.lateKnown = [...known, next];
  notes.push(LATE_UPGRADES.ideas[next]);
}

export function actLate(id: LateId){
  if (!lateKnown(id) || lateBuilt(id) || S.loc !== 'camp') return;
  const c = LATE_UPGRADES.cost[id];
  if ((c.wood && S.stock.wood < c.wood) || (c.rocks && S.stock.rocks < c.rocks)) return;
  if (id === 'shingles' && S.structure < 1) return;
  if (!spend(c.e, c.h, false, 'h')) return;
  if (c.wood) S.stock.wood -= c.wood;
  if (c.rocks) S.stock.rocks -= c.rocks;
  S.lateBuilt = [...(S.lateBuilt ?? []), id];
  sfxBuild();
  log(LATE_UPGRADES.done[id], 'good');
  afterAction('late');
}
export function actReflector(){ actLate('reflector'); }
export function actShingles(){ actLate('shingles'); }
export function actSnowWall(){ actLate('snowWall'); }
