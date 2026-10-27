// rc.8 (jobBuilds, Sir: "all of these should have predetermined length of time it takes to do,
// and energy. So you can do any number of these things, and stop while doing it"). Not in v12.
// Every build step is a few small jobs. Each job pays its own share of the step's time and energy
// and takes the materials it uses, then and there. The last job runs the step itself, so a step
// still costs what it did and does everything it did. You can stop after any job.

import { buildState, dugoutAt, stepCost, type StepCost } from './builds.ts';
import { actBed, actBerryPicker, actCache, actChair, actDugout, actFirepit, actFlute, actHugeRack, actInsulate, actJug, actRack, actShelter, actStove, actTable } from './camp.ts';
import { eCost, eTime } from './cost.ts';
import { actReflector, actShingles, actSnowWall } from './late.ts';
import { RULES } from './rules.ts';
import { S } from './state.ts';
import { afterAction, probeSpend, refuse, spend, withShare } from './threads.ts';
import { HUGE_RACK_COST, JOB_SPLIT, LATE_UPGRADES, STOVE, TUNING } from './tuning.ts';

export type JobMaterial = 'wood' | 'moss' | 'clay' | 'rocks';
const MATS: JobMaterial[] = ['wood', 'moss', 'clay', 'rocks'];
type Mats = Partial<Record<JobMaterial, number>>;

const ACTS: Record<string, () => void> = {
  shelter: actShelter, dugout: actDugout, firepit: actFirepit, rack: actRack, cache: actCache,
  'a-bed': actBed, 'a-stove': actStove, 'a-insulate': actInsulate, 'a-picker': actBerryPicker,
  'a-chair': actChair, 'a-table': actTable, 'a-jug': actJug, 'a-flute': actFlute, 'a-hugeRack': actHugeRack,
  'a-reflector': actReflector, 'a-shingles': actShingles, 'a-snowWall': actSnowWall,
};
const base = (key: string) => key.split('.')[0]!;

/** What the step behind a job key takes in materials, as its action takes them. */
function stepMats(key: string): Mats {
  const pick = (c: StepCost | Mats): Mats => Object.fromEntries(MATS.filter((m) => (c as Mats)[m]).map((m) => [m, (c as Mats)[m]]));
  switch (base(key)) {
    case 'shelter': return pick(stepCost('shelter', S.structure, S.buildProg));
    case 'dugout': { const at = dugoutAt(S.dugoutProg); return pick(stepCost('dugout', at.t, at.k)); }
    case 'firepit': return pick(stepCost('firepit', S.firepitTier + 1, S.firepitProg));
    case 'rack': return pick(stepCost('rack', S.rackTier + 1, buildState('rack').k));
    case 'cache': return pick(stepCost('cache', S.cacheTier + 1, S.cacheProg));
    case 'a-bed': case 'a-insulate': return { moss: 4 };
    case 'a-stove': return { rocks: STOVE.rocks, clay: STOVE.clay };
    case 'a-picker': return { wood: 2 };
    case 'a-chair': case 'a-table': return { wood: 3 };
    case 'a-jug': return { clay: TUNING.costs.jugClayNeed };
    case 'a-flute': return { wood: 1 };
    case 'a-hugeRack': return { wood: HUGE_RACK_COST.wood, rocks: HUGE_RACK_COST.rocks };
    case 'a-reflector': return pick(LATE_UPGRADES.cost.reflector);
    case 'a-shingles': return pick(LATE_UPGRADES.cost.shingles);
    case 'a-snowWall': return pick(LATE_UPGRADES.cost.snowWall);
  }
  return {};
}

/** The step's materials shared out between the jobs that name them; the remainder goes first. */
function shareMats(split: ReadonlyArray<readonly [number, string]>, mats: Mats): Mats[] {
  const out: Mats[] = split.map(() => ({}));
  for (const m of MATS) {
    const total = mats[m] ?? 0;
    if (!total) continue;
    let users = split.map(([, uses], i) => (uses.split(' ').includes(m) ? i : -1)).filter((i) => i >= 0);
    if (users.length === 0) users = [split.length - 1];
    const each = Math.floor(total / users.length);
    users.forEach((i, n) => { out[i]![m] = each + (n < total - each * users.length ? 1 : 0); });
  }
  return out;
}

/** The action would run now, materials aside: what it would spend, or null if it can't. */
function probe(key: string) {
  const act = ACTS[base(key)];
  if (!act) return null;
  // Materials are checked job by job, so the probe lends the action plenty.
  const had = MATS.map((m) => S.stock[m]);
  for (const m of MATS) S.stock[m] += 1e6;
  try { return probeSpend(act); } finally { MATS.forEach((m, i) => { S.stock[m] = had[i]; }); }
}

export interface Job { share: number; energy: number; hours: number; needs: Mats }
export interface JobPlan {
  key: string;
  /** Jobs done on this step so far, and how many it has. */
  done: number;
  of: number;
  /** The step can go on now (materials aside). */
  open: boolean;
  jobs: Job[];
}

/** Read-only: the jobs of the step behind this key, as they stand now. Null when not split. */
export function jobPlan(key: string): JobPlan | null {
  const split = JOB_SPLIT[key];
  if (!RULES.jobBuilds || !split || !ACTS[base(key)]) return null;
  const p = probe(key);
  const total = split.reduce((a, [w]) => a + w, 0);
  const mats = shareMats(split, stepMats(key));
  const e = p ? eCost(p.cost, p.tags) : 0, h = p ? eTime(p.hrs, p.tags) : 0;
  const jobs = split.map(([w], i) => ({ share: w / total, energy: Math.round(e * w / total), hours: h * w / total, needs: mats[i]! }));
  return { key, done: Math.min(S.jobs?.[key] ?? 0, split.length - 1), of: split.length, open: !!p, jobs };
}

/** Jobs started on a build, for the one-route rule. */
export function jobsUnder(id: string): boolean {
  return RULES.jobBuilds && Object.keys(S.jobs ?? {}).some((k) => base(k) === id && S.jobs[k] > 0);
}

const actsDone = () => Object.values(S.acts as Record<string, number>).reduce((a, n) => a + n, 0);
const enough = (m: Mats) => MATS.every((k) => S.stock[k] >= (m[k] ?? 0));
const move = (m: Mats, sign: 1 | -1) => { for (const k of MATS) if (m[k]) S.stock[k] += sign * m[k]!; };

/** Do the next job of a build step. */
export function actJob(key: string){
  if (S.over) return;
  const plan = jobPlan(key);
  if (!plan || !plan.open) return;
  const p = probe(key)!;
  const i = plan.done, job = plan.jobs[i]!;
  if (!enough(job.needs)) return refuse('You don\'t have what this job needs yet.');
  if (i < plan.of - 1){
    if (!withShare(job.share, true, () => spend(p.cost, p.hrs, p.outdoor, p.tags))) return;
    move(job.needs, -1);
    (S.jobs ||= {})[key] = i + 1;
    afterAction('job');
    return;
  }
  // The last job: the step itself, paying only this job's share. What the earlier jobs took is
  // lent back for the moment, because the action takes the whole step's materials.
  const paid: Mats = {};
  for (const j of plan.jobs.slice(0, i)) for (const m of MATS) if (j.needs[m]) paid[m] = (paid[m] ?? 0) + j.needs[m]!;
  move(paid, 1);
  const before = actsDone();
  withShare(job.share, false, ACTS[base(key)]!);
  if (actsDone() === before){ move(paid, -1); return; }
  if (S.jobs) delete S.jobs[key];
}
