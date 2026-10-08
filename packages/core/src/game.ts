// The ported v12 simulation behind one small surface: start a run, call any v12 function by
// name, read the state. Commands, previews and outcomes (plan §9.2) are layered on top of this
// in later milestones; underneath, the rules are v12's own code.

import { createRngState, type RngState } from './rng/rng.ts';
import { useRng } from './v12/runtime.ts';
import { S, setS } from './v12/state.ts';
import { RULES, TAPOUT_RULES, V12_RULES, setRules, type RuleSet } from './v12/rules.ts';
import * as breakSequence from './v12/breakSequence.ts';
import * as breakdown from './v12/breakdown.ts';
import * as camp from './v12/camp.ts';
import * as cards from './v12/cards.ts';
import * as cost from './v12/cost.ts';
import * as director from './v12/director.ts';
import * as endingSequences from './v12/endingSequences.ts';
import * as endings from './v12/endings.ts';
import * as food from './v12/food.ts';
import * as helpers from './v12/helpers.ts';
import * as interior from './v12/interior.ts';
import * as medical from './v12/medical.ts';
import * as modifiers from './v12/modifiers.ts';
import * as night from './v12/night.ts';
import * as person from './v12/person.ts';
import * as recorder from './v12/recorder.ts';
import * as resolve from './v12/resolve.ts';
import * as rules from './v12/rules.ts';
import * as setup from './v12/setup.ts';
import * as shore from './v12/shore.ts';
import * as tags from './v12/tags.ts';
import * as threads from './v12/threads.ts';
import * as travel from './v12/travel.ts';
import * as tuning from './v12/tuning.ts';
import * as woods from './v12/woods.ts';
import * as worry from './v12/worry.ts';
import * as panel from './v12/panel.ts';

const MODULES = [
  breakSequence, breakdown, camp, cards, cost, director, endingSequences, endings, food, helpers,
  interior, medical, modifiers, night, person, recorder, resolve, rules, setup, shore, tags, threads,
  travel, tuning, woods, worry, panel,
];

/** Every function v12 defines, by its v12 name. */
export const V12_FUNCTIONS: ReadonlyMap<string, (...args: any[]) => unknown> = new Map(
  MODULES.flatMap((module) =>
    Object.entries(module).filter((entry): entry is [string, (...args: any[]) => unknown] => typeof entry[1] === 'function'),
  ),
);

export interface RunOptions {
  seed: number | string;
  kit: readonly string[];
  backstory: { who: string; fear: string };
  name: string;
  heightCm: number;
  startWeightKg: number;
  sex: 'man' | 'woman';
  /** Which deliberate changes to v12 apply. Default: all of them (the TAP / OUT game). */
  rules?: Readonly<RuleSet>;
  /** The authored cast, used by TAP / OUT text. Omitted in v12 runs. */
  cast?: RunCast;
}

export interface RunCast {
  partner: string;
  prizeLabel: string;
  /** v12 rival name -> the name the radio uses. */
  rivals: Readonly<Record<string, string>>;
}

export interface Run {
  readonly rng: RngState;
  /** The live v12 state object. */
  readonly state: any;
  readonly rules: Readonly<RuleSet>;
  call: <T = unknown>(fn: string, ...args: unknown[]) => T;
}

/**
 * Starts a run. Only one run is live at a time: v12 keeps its state in a module-level `S`, and
 * starting a run replaces it.
 */
export function startRun(options: RunOptions): Run {
  const rng = createRngState(options.seed);
  useRng(rng);
  setRules(options.rules ?? TAPOUT_RULES);
  setup.newGame(
    options.backstory,
    options.startWeightKg,
    options.name,
    options.heightCm,
    options.sex,
    new Set(options.kit),
  );
  if (options.cast && RULES.content) {
    S.cast = { partner: options.cast.partner, prizeLabel: options.cast.prizeLabel };
    S.tapNames = S.tapNames.map((name: string) => options.cast!.rivals[name] ?? name);
  }
  return liveRun(rng, RULES);
}

function liveRun(rng: RngState, rules: Readonly<RuleSet>): Run {
  return {
    rng,
    rules,
    get state() {
      return S;
    },
    call: <T = unknown>(fn: string, ...args: unknown[]): T => {
      const target = V12_FUNCTIONS.get(fn);
      if (!target) throw new Error(`v12 has no function called "${fn}"`);
      useRng(rng);
      setRules(rules);
      return target(...args) as T;
    },
  };
}

// ---- Snapshots: the whole run as plain JSON. v12 state is plain data apart from the drafted
// kit, which is a Set; it is tagged on the way out and rebuilt on the way in.

export interface RunSnapshot {
  format: 'tapout-run';
  version: 1;
  rng: RngState;
  state: unknown;
  /** Absent in snapshots taken before M8, which were all v12 runs. */
  rules?: RuleSet;
}

const SET_TAG = '__set';

export function snapshotRun(run: Run): RunSnapshot {
  const state = JSON.parse(
    JSON.stringify(run.state, (_key, value) => (value instanceof Set ? { [SET_TAG]: [...value] } : value)),
  );
  return { format: 'tapout-run', version: 1, rng: { ...run.rng }, state, rules: { ...RULES } };
}

export function restoreRun(snapshot: RunSnapshot): Run {
  if (snapshot?.format !== 'tapout-run' || snapshot.version !== 1) throw new Error('Not a TAP / OUT run snapshot.');
  const state = JSON.parse(JSON.stringify(snapshot.state), (_key, value) =>
    value && typeof value === 'object' && !Array.isArray(value) && Array.isArray(value[SET_TAG]) && Object.keys(value).length === 1
      ? new Set(value[SET_TAG])
      : value,
  );
  const rng = { ...snapshot.rng };
  setRules(snapshot.rules ? { ...V12_RULES, ...snapshot.rules } : V12_RULES);
  setS(state);
  useRng(rng);
  return liveRun(rng, RULES);
}

export { actionPanel, hudRecord, BUTTONS, type PanelEntry, type HudElement } from './v12/panel.ts';
export { setPresenter, type Presenter } from './v12/ui.ts';
export { TAPOUT_RULES, V12_RULES, type RuleSet } from './v12/rules.ts';
export { rationsLeft } from './v12/camp.ts';
export { forcedTapCause } from './v12/threads.ts';

/**
 * Read-only v12 values and helpers the presentation shows. None of them changes state or draws
 * a random number; the UI uses them to describe the run, never to decide anything.
 */
export { KIT_POOL, WEATHER, SHELTERS, BUILD_NEED, CARRY_CAP, GAME, MAX_SNARES_PER_SPOT, MAX_LINES_TOTAL } from './v12/tuning.ts';
export { ambientTempC } from './v12/cost.ts';
export { fireCap } from './v12/camp.ts';
export { waterCap, computeBMI } from './v12/setup.ts';
export { meatCount, berryCount } from './v12/food.ts';
export { roundDisplay, hh, duskHour, dawnHour } from './v12/helpers.ts';
