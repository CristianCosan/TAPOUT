// npm run balance -- --seeds 200 --days 70
// Plays the same seeds under v12's rules, under TAP / OUT's, and under each single change on its
// own, and prints how the run outcomes move. M8's change report is built from this.
import { TAPOUT_RULES, V12_RULES, type RuleSet } from '@tapout/core';
import { CAST } from '@tapout/content';
import { runSolo, type SoloResult } from '../parity/lockstep.ts';

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}

const seeds = Number(arg('seeds', '100'));
const days = Number(arg('days', '70'));
const prefix = arg('prefix', 'balance');
const persona = arg('persona', 'survivor') as 'random' | 'survivor';
const singles = arg('singles', 'yes') !== 'no';

interface Row {
  name: string;
  runs: SoloResult[];
}

function sweep(name: string, rules: Readonly<RuleSet>): Row {
  const runs: SoloResult[] = [];
  for (let i = 0; i < seeds; i += 1) runs.push(runSolo({ seed: `${prefix}-${i}` }, { days, persona }, rules, CAST));
  return { name, runs };
}

const pct = (n: number, d: number) => `${((100 * n) / Math.max(1, d)).toFixed(1)}%`;
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function line(row: Row): string {
  const n = row.runs.length;
  const count = (fn: (r: SoloResult) => boolean) => row.runs.filter(fn).length;
  const cause = (c: string) => count((r) => r.over && r.cause === c);
  return [
    row.name,
    pct(cause('dead'), n),
    pct(cause('med'), n),
    pct(cause('tap'), n),
    pct(count((r) => !!r.state.forcedTapout), n),
    pct(cause('win'), n),
    pct(count((r) => !r.over), n),
    String(median(row.runs.map((r) => r.finalDay))),
  ].join(' | ');
}

const rows: Row[] = [sweep('v12', V12_RULES), sweep('TAP / OUT (all changes)', TAPOUT_RULES)];
if (singles) {
  for (const key of Object.keys(V12_RULES) as Array<keyof RuleSet>) {
    if (key === 'content') continue;
    rows.push(sweep(`only ${key}`, { ...V12_RULES, [key]: true }));
  }
}

process.stdout.write(`${seeds} ${persona} runs per row, same seeds, up to day ${days}.\n\n`);
process.stdout.write('| Rules | Dead | Med pull | Tapped out | of which forced | Won | Still in | Median end day |\n');
process.stdout.write('|---|---|---|---|---|---|---|---|\n');
for (const row of rows) process.stdout.write(`| ${line(row)} |\n`);
