// npm run soak -- --seeds 100
// Beta soak (plan M22): plays many whole TAP / OUT runs, saving and reloading through JSON every
// few decisions the way the app's autosave does, and reports anything that went wrong: a thrown
// error, a run that stalled before an ending, a number in the state that is not finite, or a
// save that grew too large. Exits non-zero if any run failed.
import { TAPOUT_RULES } from '@tapout/core';
import { CAST } from '@tapout/content';
import { runSolo } from '../parity/lockstep.ts';

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}

const seeds = Number(arg('seeds', '100'));
const days = Number(arg('days', '70'));
const resumeEvery = Number(arg('resume', '7'));
const SAVE_LIMIT = 2 * 1024 * 1024;

/** Paths of numbers in the state that are NaN or infinite. */
function badNumbers(value: unknown, path = 'S', out: string[] = [], seen = new Set<unknown>()): string[] {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) out.push(path);
  } else if (value && typeof value === 'object' && !seen.has(value)) {
    seen.add(value);
    for (const [k, v] of Object.entries(value)) badNumbers(v, `${path}.${k}`, out, seen);
  }
  return out;
}

const failures: string[] = [];
const causes = new Map<string, number>();
let biggest = 0;
let decisions = 0;
const t0 = performance.now();
for (let i = 0; i < seeds; i += 1) {
  const seed = `soak-${i}`;
  const persona = i % 2 ? 'survivor' : 'random';
  try {
    const run = runSolo({ seed }, { days, persona, resumeEvery, tapOutChance: 0.01 }, TAPOUT_RULES, CAST);
    decisions += run.decisions;
    const cause = run.over ? (run.state.cause ?? 'over') : run.finalDay > days ? 'outlasted the test' : 'stalled';
    causes.set(cause, (causes.get(cause) ?? 0) + 1);
    if (cause === 'stalled') failures.push(`${seed} (${persona}): stopped on day ${run.finalDay} after ${run.decisions} decisions with no ending`);
    const bad = badNumbers(run.state);
    if (bad.length) failures.push(`${seed} (${persona}): not finite: ${bad.slice(0, 5).join(', ')}`);
    const size = JSON.stringify(run.state).length;
    biggest = Math.max(biggest, size);
    if (size > SAVE_LIMIT) failures.push(`${seed} (${persona}): state is ${(size / 1024).toFixed(0)} KB`);
  } catch (error) {
    failures.push(`${seed} (${persona}): threw ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
  }
}
const seconds = (performance.now() - t0) / 1000;
process.stdout.write(`${seeds} runs, ${decisions} decisions, ${seconds.toFixed(1)} s, largest state ${(biggest / 1024).toFixed(0)} KB\n`);
process.stdout.write(`endings: ${[...causes].map(([c, n]) => `${c} ${n}`).join(' · ')}\n`);
if (failures.length) {
  process.stdout.write(`${failures.length} problem(s):\n${failures.map((f) => `  ${f}`).join('\n')}\n`);
  process.exitCode = 1;
} else process.stdout.write('no problems\n');
