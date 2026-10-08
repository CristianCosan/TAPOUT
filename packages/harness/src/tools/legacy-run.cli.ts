// Prints a short summary of a scripted legacy run: `npm run legacy:run -- --days 3 --seed x`.
import { playDays } from '../legacy/script-run.ts';

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}

const seed = arg('seed', 'demo');
const days = Number(arg('days', '3'));
const result = playDays({ seed }, days);
const state = result.game.state as Record<string, number | string | boolean>;
const n = (value: unknown) => Number(value).toFixed(1);

const lines = [
  `legacy v12 · seed "${seed}" · ${days} day(s) · ${result.script.length} calls · ${result.game.rng.draws} random draws`,
  '',
  'day  hour   energy  warmth  hunger  thirst  morale  stress  what happened',
];
for (const step of result.steps) {
  const s = step.state as Record<string, unknown>;
  lines.push(
    `${String(step.day).padStart(3)}  ${n(step.hour).padStart(5)}  ${n(s.energy).padStart(6)}  ${n(s.warmth).padStart(6)}  ${n(s.hunger).padStart(6)}  ${n(s.thirst).padStart(6)}  ${n(s.morale).padStart(6)}  ${n(s.stress).padStart(6)}  ${step.label}`,
  );
}
lines.push(
  '',
  `ended: day ${state.day}, ${state.over ? `over (${state.cause})` : 'still in the field'}, ${state.rivals} rivals left, ${n(state.weight)} kg`,
);
process.stdout.write(`${lines.join('\n')}\n`);
