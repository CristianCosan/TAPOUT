// npm run parity -- --seeds 20 --days 40
import { runLockstep } from '../parity/lockstep.ts';

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}

const seeds = Number(arg('seeds', '10'));
const days = Number(arg('days', '40'));
const prefix = arg('prefix', 'lockstep');
const tap = Number(arg('tap', '0'));
const persona = arg('persona', 'random') as 'random' | 'survivor';
const resumeEvery = Number(arg('resume', '0')) || undefined;
let failures = 0;
let decisions = 0;
const handlers = new Set<string>();
const endings: Record<string, number> = {};
const lastDays: number[] = [];
for (let i = 0; i < seeds; i += 1) {
  const seed = `${prefix}-${i}`;
  const result = runLockstep({ seed }, { days, tapOutChance: tap, persona, resumeEvery });
  decisions += result.decisions.length;
  result.handlersSeen.forEach((h) => handlers.add(h));
  lastDays.push(result.finalDay);
  const ending = result.over ? result.cause : 'alive';
  endings[ending] = (endings[ending] ?? 0) + 1;
  if (result.divergence) {
    failures += 1;
    const d = result.divergence;
    const recent = result.decisions.slice(-4).map((x) => x.handler).join(' | ');
    process.stdout.write(
      `DIVERGED ${seed} at decision ${d.step} (${d.label}) day ${result.finalDay}\n  ${d.path}\n  legacy: ${JSON.stringify(d.legacy)?.slice(0, 300)}\n  port:   ${JSON.stringify(d.port)?.slice(0, 300)}\n  recent: ${recent}\n`,
    );
  }
}
process.stdout.write(
  `\n${seeds - failures}/${seeds} runs identical · ${decisions} decisions · endings ${JSON.stringify(endings)} · ${handlers.size} distinct handlers · final days ${lastDays.sort((a, b) => a - b).join(',')}\n`,
);
process.exitCode = failures > 0 ? 1 : 0;
