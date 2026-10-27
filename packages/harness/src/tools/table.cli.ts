// npm run table -- out.json
// rc.8 (Sir: "the list of game time per action and every build click by click should be made into
// one"). Reads the game's own numbers: each everyday action is done once in a fresh run and its
// time and energy measured; each build job is read from the core's job plan at that step. Writes
// JSON for the table page. Nothing here decides anything; it only reports.
import { writeFileSync } from 'node:fs';
import { CARRY_CAP, jobPlan, KIT_POOL, setPresenter, SIR_TIMES, startRun, TAPOUT_RULES, type Run } from '@tapout/core';
import { BUILD_TASKS, CAST, UPGRADE_TEXT } from '@tapout/content';

const STD_KIT = (KIT_POOL as Array<{ id: string; std?: boolean }>).filter((k) => k.std).map((k) => k.id);
setPresenter({ showModal: () => {}, hideModal: () => {}, typewriterInto: () => {} });

const FULL_KIT = [...STD_KIT, 'shovel', 'knife'];
function fresh(kit: string[] = FULL_KIT): Run {
  const run = startRun({ seed: 'table', kit, backstory: { who: 'partner', fear: 'failing' }, name: 'Dan', heightCm: 178, startWeightKg: 88, sex: 'man', rules: TAPOUT_RULES, cast: CAST });
  Object.assign(run.state, { loc: 'camp', hour: 9, energy: 180, maxEnergy: 180, weather: 'overcast', wet: 0 });
  Object.assign(run.state.stock, { wood: 100, moss: 100, clay: 100, rocks: 100, firewood: 100 });
  run.state.tinder = 20;
  return run;
}
const clock = (run: Run) => run.state.day * 1440 + run.state.hour * 60;

interface Act { group: string; name: string; minutes: number | string; energy: number | string; note?: string }
const acts: Act[] = [];
function measure(group: string, name: string, prep: (run: Run) => void, call: (run: Run) => void, note?: string, kit?: string[]) {
  const run = fresh(kit);
  prep(run);
  const t = clock(run), e = run.state.energy;
  call(run);
  acts.push({ group, name, minutes: Math.round(clock(run) - t), energy: e - run.state.energy, note });
}
const at = (loc: string, more: Record<string, unknown> = {}) => (run: Run) => Object.assign(run.state, { loc, ...more });

measure('Camp', 'Stoke the fire', at('camp', { fireH: 2 }), (r) => r.call('actFire'), 'free, 1 firewood');
acts.push({ group: 'Camp', name: 'Light a fire, ferro rod', minutes: `${SIR_TIMES.fireDryMin.join('-')} dry, ${SIR_TIMES.fireWetMin.join('-')} in rain, ${SIR_TIMES.fireSpellMin.join('-')} after ${SIR_TIMES.wetSpellDays}+ wet days`, energy: 0, note: '2 firewood + 1 tinder' });
acts.push({ group: 'Camp', name: 'Friction fire (no ferro rod)', minutes: `${SIR_TIMES.frictionHours[0] * 60}-${SIR_TIMES.frictionHours[1] * 60}`, energy: 6, note: 'can fail' });
measure('Camp', 'Boil water', at('camp', { fireH: 3, rawWater: 3, water: 0 }), (r) => r.call('actBoil'));
measure('Woods', 'Gather firewood by hand', at('woods'), (r) => r.call('actFirewood'));
measure('Camp', 'Sit down and rest', at('camp', { energy: 100 }), (r) => r.call('actRest'), 'gives energy back');
measure('Shore', 'Fetch water', at('shore', { rawWater: 0 }), (r) => r.call('actFetchWater'));
measure('Shore', 'Haul rocks (+3)', at('shore'), (r) => r.call('actRocks'));
measure('Shore', 'Dig clay (+2-3)', at('shore'), (r) => r.call('actClay'), 'with the shovel; 20 min with the axe, 30 by hand');
measure('Woods', 'Forage berries', at('woods'), (r) => r.call('actForage'));
measure('Woods', 'Gather tinder', at('woods'), (r) => r.call('actTinder'));
measure('Woods', 'Fell and buck logs (+3-5)', at('woods'), (r) => r.call('actWood'), 'axe and saw');
measure('Woods', 'Peel moss (+3-4)', at('woods'), (r) => r.call('actMoss'));
acts.push({ group: 'Woods', name: 'Set a snare', minutes: 2, energy: 2 });
acts.push({ group: 'Woods', name: 'Check a snare', minutes: 2, energy: 1 });
measure('Woods', 'Look for tracks', at('woods'), (r) => r.call('actScout'), 'bow');
measure('Woods', 'Follow tracks', at('woods', { hunt: { state: 'tracks', day: 1, species: '' } }), (r) => r.call('actFollow'), 'bow');
measure('Hunt', 'Carve a deer, good knife', at('woods', { killSite: { species: 'deer', loc: 'woods', carved: false } }), (r) => r.call('actCarve'));
measure('Hunt', 'Carve a deer, no knife', at('woods', { killSite: { species: 'deer', loc: 'woods', carved: false } }), (r) => r.call('actCarve'), undefined, STD_KIT);
measure('Hunt', 'Carve a moose, good knife', at('woods', { killSite: { species: 'moose', loc: 'woods', carved: false } }), (r) => r.call('actCarve'));
measure('Hunt', 'Carve a moose, no knife', at('woods', { killSite: { species: 'moose', loc: 'woods', carved: false } }), (r) => r.call('actCarve'), undefined, STD_KIT);
measure('Travel', 'Walk between places', at('camp'), (r) => r.call('goTo', 'shore'), 'before the snow');
measure('Travel', 'Walk between places, snow', at('camp', { winter: true }), (r) => r.call('goTo', 'shore'), 'after the snow');

// ---- every build job, at its own step
const STEPS: Record<string, number[]> = { shelter: [2, 3, 5], dugout: [3, 1, 1], firepit: [2, 3], rack: [3, 2], cache: [2, 2, 3] };
function stateFor(run: Run, key: string) {
  const S = run.state;
  const [id, nText] = key.split('.');
  const n = Number(nText);
  if (STEPS[id!]) {
    let left = n - 1, tier = 0;
    while (left >= STEPS[id!]![tier]!) { left -= STEPS[id!]![tier]!; tier++; }
    if (id === 'shelter') Object.assign(S, { structure: tier, buildProg: left });
    if (id === 'dugout') Object.assign(S, { dugoutProg: n - 1 });
    if (id === 'firepit') Object.assign(S, { firepitTier: tier, firepitProg: left });
    if (id === 'rack') Object.assign(S, { rackTier: tier, rackProg: left });
    if (id === 'cache') Object.assign(S, { cacheTier: tier, cacheProg: left });
    return;
  }
  if (id === 'a-insulate') Object.assign(S, { structure: 1, insulation: n - 1 });
  if (id === 'a-stove') Object.assign(S, { structure: 2 });
  if (id === 'a-jug') Object.assign(S, { fireH: 3 });
  if (id === 'a-hugeRack') Object.assign(S, { rackTier: 1 });
  if (id === 'a-reflector' || id === 'a-shingles' || id === 'a-snowWall') Object.assign(S, { structure: 1, day: 22, winter: id === 'a-snowWall', lateKnown: ['reflector', 'shingles', 'snowWall'] });
}
const NAMES: Record<string, string> = { 'a-bed': 'Bough bed', 'a-stove': 'Stone stove', 'a-insulate': 'Insulation', 'a-picker': 'Berry picker', 'a-chair': 'Chair', 'a-table': 'Table', 'a-jug': 'Clay jug', 'a-flute': 'Flute', 'a-hugeRack': 'Big smoking rack', 'a-reflector': 'Reflector wall', 'a-shingles': 'Bark shingles', 'a-snowWall': 'Snow wall' };
interface JobRow { build: string; tier: string; step: string; job: string; minutes: number; energy: number; needs: Record<string, number> }
const jobs: JobRow[] = [];
for (const key of Object.keys(BUILD_TASKS)) {
  const run = fresh();
  stateFor(run, key);
  const plan = jobPlan(key);
  if (!plan || !plan.open) throw new Error(`no job plan for ${key}`);
  const [id, nText] = key.split('.');
  const n = Number(nText);
  let build = NAMES[id!] ?? id!, tier = '', step = '';
  if (STEPS[id!]) {
    let left = n - 1, t = 0;
    while (left >= STEPS[id!]![t]!) { left -= STEPS[id!]![t]!; t++; }
    const uid = id as keyof typeof UPGRADE_TEXT.names;
    build = UPGRADE_TEXT.routes[uid].title;
    tier = UPGRADE_TEXT.names[uid][t + 1]!;
    step = UPGRADE_TEXT.steps[uid][n - 1]!;
  } else if (id === 'a-insulate') step = `Round ${n} of 3`;
  plan.jobs.forEach((j, i) => jobs.push({ build, tier, step, job: BUILD_TASKS[key]!.jobs[i]!, minutes: Math.round(j.hours * 60), energy: j.energy, needs: j.needs as Record<string, number> }));
}

// The day's energy as the game sets it, for the days-of-work estimate.
const energyByDay = Array.from({ length: 30 }, (_, i) => fresh().call('maxEnergyForDay', i + 1) as number);
writeFileSync(process.argv[2] ?? 'table.json', JSON.stringify({ acts, jobs, carry: CARRY_CAP, energyByDay }, null, 2));
process.stdout.write(`${acts.length} actions, ${jobs.length} build jobs\n`);
