// Runs the untouched v12 file in Node so the port can be compared against it.
//
// The HTML is never modified. Its single <script> is lifted out and evaluated
// in a VM context holding the DOM stub and a seeded `Math.random`, so the whole
// game behaves exactly as it does in a browser except that the page it paints
// goes nowhere and every random draw is reproducible.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createRngState, randomFn, type RngState } from '@tapout/core';
import { createDomStub, type DomStub } from './dom-stub.ts';

export const LEGACY_PATH = fileURLToPath(new URL('../../../../legacy/tap-out-v12.html', import.meta.url));

export interface LegacyBackstory {
  who: 'partner' | 'kid' | 'parent' | 'nobody';
  fear: 'dark' | 'injury' | 'failing' | 'empty';
}

export interface LegacyStartOptions {
  seed: number | string;
  /** Kit item ids; v12 expects ten. Defaults to a plain, balanced ten. */
  kit?: readonly string[];
  backstory?: LegacyBackstory;
  name?: string;
  heightCm?: number;
  startWeightKg?: number;
  sex?: 'man' | 'woman';
}

export const DEFAULT_KIT = [
  'axe',
  'saw',
  'ferro',
  'pot',
  'knife',
  'sleeping',
  'tarp',
  'line',
  'snare',
  'bow',
] as const;

export function resolveRunOptions(options: LegacyStartOptions) {
  return {
    seed: options.seed,
    kit: [...(options.kit ?? DEFAULT_KIT)],
    backstory: options.backstory ?? { who: 'partner', fear: 'failing' },
    name: options.name ?? 'Jack',
    heightCm: options.heightCm ?? 178,
    startWeightKg: options.startWeightKg ?? 88,
    sex: options.sex ?? 'man',
  } as const;
}

export interface LegacyGame {
  /** The live `S` object the game mutates. Read it; never write to it. */
  readonly state: Record<string, unknown>;
  /** Calls a global v12 function by name, e.g. `call('actGatherFirewood')`. */
  call: <T = unknown>(fn: string, ...args: unknown[]) => T;
  /** Evaluates an expression against the game's own scope, e.g. `read('TUNING.energy.startArrival')`. */
  read: <T = unknown>(expression: string) => T;
  /** Runs a statement in the game's scope, e.g. an inline button handler. */
  run: (code: string) => void;
  /** The modal v12 is showing, or null. Tracked by replacing its two presentation functions. */
  modal: () => string | null;
  /** A structural snapshot of `S`, safe to compare and to store. */
  snapshot: () => unknown;
  readonly rng: RngState;
  readonly dom: DomStub;
}

function extractScript(html: string): string {
  const open = html.indexOf('<script>');
  const close = html.lastIndexOf('</script>');
  if (open < 0 || close < 0) throw new Error('No <script> block found in the legacy file.');
  return html.slice(open + '<script>'.length, close);
}

/** Deep clone that drops functions and turns Sets and Maps into plain data. */
export function plain(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== 'object') {
    return typeof value === 'function' ? undefined : value;
  }
  if (seen.has(value as object)) return '[circular]';
  seen.add(value as object);
  // Tag checks, not instanceof: values created inside the VM context come from another realm.
  const tag = Object.prototype.toString.call(value);
  if (tag === '[object Set]') {
    return { __set: [...(value as Set<unknown>)].map((item) => plain(item, seen)).sort() };
  }
  if (tag === '[object Map]') {
    return { __map: [...(value as Map<unknown, unknown>).entries()].map(([k, v]) => [plain(k, seen), plain(v, seen)]) };
  }
  if (Array.isArray(value)) return value.map((item) => plain(item, seen));
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const cleaned = plain(item, seen);
    if (cleaned !== undefined) out[key] = cleaned;
  }
  return out;
}

export function loadLegacyGame(options: LegacyStartOptions): LegacyGame {
  const dom = createDomStub();
  const rng = createRngState(options.seed);
  const random = randomFn(rng);

  const sandbox: Record<string, unknown> = {
    window: dom.window,
    document: dom.document,
    navigator: dom.window.navigator,
    location: dom.window.location,
    console: { log: () => {}, warn: () => {}, error: () => {} },
    Math: Object.create(Math, { random: { value: random, writable: true } }),
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
  };
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  const context = vm.createContext(sandbox);
  // The game reaches for `window.X` as often as bare `X`, so the two must be
  // the same object.
  Object.setPrototypeOf(dom.window, sandbox);

  const source = extractScript(readFileSync(LEGACY_PATH, 'utf8'));
  vm.runInContext(source, context, { filename: 'tap-out-v12.html' });

  const read = <T = unknown>(expression: string): T =>
    vm.runInContext(`(${expression})`, context, { filename: 'legacy-read' }) as T;

  const call = <T = unknown>(fn: string, ...args: unknown[]): T => {
    const target = read<unknown>(fn);
    if (typeof target !== 'function') throw new Error(`v12 has no function called "${fn}"`);
    (sandbox as Record<string, unknown>).__args = args;
    return vm.runInContext(`${fn}(...__args)`, context, { filename: 'legacy-call' }) as T;
  };

  // showModal/hideModal only paint; swapping them for recorders leaves the rules untouched and
  // lets a driver see which choices v12 is offering.
  vm.runInContext(
    `var __modal = null;
     showModal = function(html){ __modal = html; };
     hideModal = function(){ __modal = null; };`,
    context,
  );

  // Start the run the way startGame() does, minus its two presentation calls: the rain and
  // snow particle builder spends 144 random draws on decoration, and audio is absent anyway.
  const run = resolveRunOptions(options);
  call('newGame', run.backstory, run.startWeightKg, run.name, run.heightCm, run.sex, new Set(run.kit));

  const state = read<Record<string, unknown>>('S');
  return {
    state,
    call,
    read,
    run: (code: string) => {
      vm.runInContext(code, context, { filename: 'legacy-handler' });
    },
    modal: () => read<string | null>('__modal'),
    snapshot: () => plain(read('S')),
    rng,
    dom,
  };
}
