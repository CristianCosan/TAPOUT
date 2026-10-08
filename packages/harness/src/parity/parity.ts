// Differential test between the untouched v12 file and the port: the same seed, the same calls,
// state compared after every one of them. The first difference is reported with its path.

import { startRun } from '@tapout/core';
import { loadLegacyGame, plain, resolveRunOptions, type LegacyStartOptions } from '../legacy/legacy-game.ts';
import type { Step } from '../legacy/script-run.ts';

export interface Divergence {
  step: number;
  label: string;
  path: string;
  legacy: unknown;
  port: unknown;
}

export interface ParityResult {
  steps: number;
  draws: number;
  divergence: Divergence | null;
}

export function firstDifference(a: unknown, b: unknown, path = 'S'): { path: string; a: unknown; b: unknown } | null {
  if (Object.is(a, b)) return null;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return { path, a, b };
  if (Array.isArray(a) !== Array.isArray(b)) return { path, a, b };
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of [...keys].sort()) {
    const diff = firstDifference((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], `${path}.${key}`);
    if (diff) return diff;
  }
  return null;
}

/** Plays `script` through both games and stops at the first step where they disagree. */
export function runParity(options: LegacyStartOptions, script: readonly Step[]): ParityResult {
  const legacy = loadLegacyGame(options);
  const port = startRun(resolveRunOptions(options));

  const compare = (step: number, label: string): Divergence | null => {
    const drawDiff = legacy.rng.draws !== port.rng.draws;
    const diff = firstDifference(plain(legacy.read('S')), plain(port.state));
    if (diff) return { step, label, path: diff.path, legacy: diff.a, port: diff.b };
    if (drawDiff) return { step, label, path: '(random draws)', legacy: legacy.rng.draws, port: port.rng.draws };
    return null;
  };

  let divergence = compare(0, 'start');
  let steps = 0;
  for (const step of script) {
    if (divergence) break;
    legacy.call(step.fn, ...(step.args ?? []));
    port.call(step.fn, ...(step.args ?? []));
    steps += 1;
    divergence = compare(steps, step.label ?? step.fn);
  }
  return { steps, draws: port.rng.draws, divergence };
}
