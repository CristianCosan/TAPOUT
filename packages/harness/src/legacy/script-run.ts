// Drives a scripted run through the legacy game and records a snapshot after
// every step. The parity runner (M7) replays the same script against the port
// and compares these snapshots step by step.

import { loadLegacyGame, plain, type LegacyGame, type LegacyStartOptions } from './legacy-game.ts';

export interface Step {
  /** A v12 global function name, e.g. 'actFirewood'. */
  fn: string;
  args?: readonly unknown[];
  label?: string;
}

export interface StepRecord {
  index: number;
  label: string;
  day: number;
  hour: number;
  draws: number;
  state: unknown;
}

export interface ScriptResult {
  seed: number | string;
  steps: StepRecord[];
  /** The calls actually made, replayable against the port. */
  script: Step[];
  game: LegacyGame;
}

export function runScript(options: LegacyStartOptions, script: readonly Step[]): ScriptResult {
  const game = loadLegacyGame(options);
  const steps: StepRecord[] = [];
  const record = (index: number, label: string) => {
    steps.push({
      index,
      label,
      day: Number(game.state.day),
      hour: Number(game.state.hour),
      draws: game.rng.draws,
      state: plain(game.state),
    });
  };

  record(0, 'start');
  script.forEach((step, index) => {
    game.call(step.fn, ...(step.args ?? []));
    record(index + 1, step.label ?? step.fn);
  });
  return { seed: options.seed, steps, script: [...script], game };
}

/** The rotation a plain camp day is filled with, in order. */
export const DAY_ROTATION: readonly Step[] = [
  { fn: 'actFirewood' },
  { fn: 'actTinder' },
  { fn: 'actFetchWater' },
  { fn: 'actFire' },
  { fn: 'actBoil' },
  { fn: 'actDrink' },
  { fn: 'actForage' },
  { fn: 'actWood' },
  { fn: 'actCheckShore' },
  { fn: 'actRest' },
];

const BEDTIME_HOUR = 16;

/**
 * Fills `days` days with the rotation until bedtime, sleeping at the end of
 * each one, and returns the exact list of calls that were made. That list is
 * the replayable script: the port is driven through it call for call.
 */
export function playDays(options: LegacyStartOptions, days: number): ScriptResult {
  const game = loadLegacyGame(options);
  const steps: StepRecord[] = [];
  const executed: Step[] = [];
  const record = (label: string) => {
    steps.push({
      index: steps.length,
      label,
      day: Number(game.state.day),
      hour: Number(game.state.hour),
      draws: game.rng.draws,
      state: plain(game.state),
    });
  };
  const perform = (step: Step) => {
    game.call(step.fn, ...(step.args ?? []));
    executed.push(step);
    record(step.label ?? step.fn);
  };

  record('start');
  let rotation = 0;
  while (Number(game.state.day) <= days && !game.state.over) {
    const startOfDay = Number(game.state.day);
    let guard = 0;
    while (
      Number(game.state.hour) < BEDTIME_HOUR &&
      Number(game.state.day) === startOfDay &&
      !game.state.over &&
      guard < 400
    ) {
      const step = DAY_ROTATION[rotation % DAY_ROTATION.length]!;
      rotation += 1;
      guard += 1;
      // Refused actions are kept in the script on purpose: the port has to
      // refuse the same ones for the same reasons.
      perform(step);
    }
    if (game.state.over) break;
    const early = Number(game.state.hour) < BEDTIME_HOUR;
    perform({ fn: 'actSleep', args: [early], label: early ? 'sleep (early)' : 'sleep' });
  }
  return { seed: options.seed, steps, script: executed, game };
}
