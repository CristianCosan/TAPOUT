// npm run builds -- --seeds 100 --days 32
// rc.8 (Sir: "by day 25-30, most things should be able to be built... the essential ones, and of
// course just one of the shelters"). Plays the competent bot and notes the day each camp build
// was finished, then prints how many runs had each one by day 25 and by day 30.
import { KIT_POOL, TAPOUT_RULES, type RuleSet } from '@tapout/core';
import { CAST } from '@tapout/content';
import { runSolo } from '../parity/lockstep.ts';

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}
const seeds = Number(arg('seeds', '100'));
const days = Number(arg('days', '32'));
const persona = arg('persona', 'competent') as 'survivor' | 'competent';
const STD_KIT = (KIT_POOL as Array<{ id: string; std?: boolean }>).filter((k) => k.std).map((k) => k.id);
const without = arg('without', '').split(',').filter(Boolean) as Array<keyof RuleSet>;
const rules: RuleSet = { ...TAPOUT_RULES };
for (const key of without) rules[key] = false;

const MILESTONES: Array<[string, (S: any) => boolean]> = [
  ['Lean-to', (S) => S.structure >= 1],
  ['Framed hut', (S) => S.structure >= 2],
  ['Timber shelter', (S) => S.structure >= 3],
  ['Earth dugout', (S) => !!S.dugout],
  ['Either shelter finished', (S) => S.structure >= 3 || !!S.dugout],
  ['Stone ring', (S) => S.firepitTier >= 1],
  ['Clay-lined pit', (S) => S.firepitTier >= 2],
  ['Tripod rack', (S) => S.rackTier >= 1],
  ['Roofed rack', (S) => S.rackTier >= 2],
  ['Cache', (S) => S.cacheTier >= 1],
  ['Raised cache', (S) => S.cacheTier >= 3],
  ['Bough bed', (S) => !!S.bed],
  ['Insulation 3/3', (S) => S.insulation >= 3],
  ['Stone stove', (S) => !!S.stove],
];

const reached: Array<Record<string, number>> = [];
const lastDay: number[] = [];
for (let i = 0; i < seeds; i += 1) {
  const at: Record<string, number> = {};
  const r = runSolo({ seed: `builds-${i}`, kit: STD_KIT }, {
    days,
    persona,
    onStep: (S) => {
      for (const [name, done] of MILESTONES) if (at[name] === undefined && done(S)) at[name] = S.day;
    },
  }, rules, CAST);
  reached.push(at);
  lastDay.push(r.finalDay);
}

const alive = (d: number) => lastDay.filter((x) => x >= d).length;
const pct = (n: number, d: number) => `${Math.round((100 * n) / Math.max(1, d))}%`;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? String(s[Math.floor(s.length / 2)]) : '-';
};
process.stdout.write(`${seeds} ${persona} runs, usual ten kit, up to day ${days}${without.length ? `, without ${without.join(', ')}` : ''}.\n`);
process.stdout.write(`Still in at day 25: ${alive(25)}, at day 30: ${alive(30)}.\n\n`);
process.stdout.write('| Build | Median day finished | Had it by day 25 (of runs still in) | Had it by day 30 (of runs still in) |\n|---|---|---|---|\n');
for (const [name] of MILESTONES) {
  const daysDone = reached.map((at) => at[name]).filter((d): d is number => d !== undefined);
  const by = (d: number) => reached.filter((at, i) => lastDay[i]! >= d && (at[name] ?? Infinity) <= d).length;
  process.stdout.write(`| ${name} | ${median(daysDone)} | ${pct(by(25), alive(25))} | ${pct(by(30), alive(30))} |\n`);
}
