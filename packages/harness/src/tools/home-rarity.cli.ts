// npm run home:rarity -- --seeds 200
// How often the parents / no-contact thread (plan §8.4) reaches each stage, against its
// rarity targets: stage 1 in 15-30% of runs, stage 3 in at most 8%, the Waiver card in at most
// 4%, thread-caused forced tap-outs at most 1.5%.
import { TAPOUT_RULES } from '@tapout/core';
import { CAST } from '@tapout/content';
import { runSolo } from '../parity/lockstep.ts';

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}

const seeds = Number(arg('seeds', '200'));
const days = Number(arg('days', '70'));
const personas = arg('persona', 'survivor,random').split(',') as Array<'survivor' | 'random'>;
// Try other numbers without editing content: --tune '{"gateScore":4}'.
const tune = JSON.parse(arg('tune', '{}')) as Record<string, unknown>;
const cast = { ...CAST, home: { ...CAST.home!, tuning: { ...CAST.home!.tuning, ...tune } } };
for (const persona of personas) {
  const stage = [0, 0, 0, 0, 0];
  let card = 0;
  let forced = 0;
  for (let i = 0; i < seeds; i += 1) {
    const run = runSolo({ seed: `home-${i}` }, { days, persona }, TAPOUT_RULES, cast);
    const h = run.state.home as { stage: number; cardShown: boolean; forced: boolean } | undefined;
    stage[h?.stage ?? 0]! += 1;
    if (h?.cardShown) card += 1;
    if (h?.forced && run.state.cause === 'tap') forced += 1;
  }
  const at = (s: number) => stage.slice(s).reduce((a, b) => a + b, 0);
  const pct = (n: number) => `${((100 * n) / seeds).toFixed(1)}%`;
  process.stdout.write(
    `${persona}: stage 1+ ${pct(at(1))} · 2+ ${pct(at(2))} · 3+ ${pct(at(3))} · 4 ${pct(at(4))} · card ${pct(card)} · forced tap ${pct(forced)}\n`,
  );
}
