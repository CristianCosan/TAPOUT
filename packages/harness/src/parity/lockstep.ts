// Plays v12 and the port side by side, one player decision at a time, and compares their whole
// state after every decision. A bot makes the decisions from what v12 itself offers: the action
// panel, the eat and drink chips, travel, sleep, and the buttons of whatever modal is open.
//
// The bot draws from its own seeded stream, never from the game's, so its choices cannot
// disturb the parity of the two simulations.

import { actionPanel, createRngState, nextFloat, restoreRun, setPresenter, snapshotRun, startRun, type RngState, type Run } from '@tapout/core';
import { loadLegacyGame, plain, resolveRunOptions, type LegacyGame, type LegacyStartOptions } from '../legacy/legacy-game.ts';
import { modalButtons, parseHandler } from '@tapout/core';
import { firstDifference, type Divergence } from './parity.ts';

export interface Decision {
  /** A v12 inline handler, e.g. `actFirewood()` or `hideModal(); resolveCardChoice('heyBear',1)`. */
  handler: string;
  label: string;
}

export interface LockstepOptions {
  days: number;
  /** 'random' explores every offered action; 'survivor' plays to stay alive so runs reach winter. */
  persona?: 'random' | 'survivor';
  maxDecisions?: number;
  /** Save and reload the port through JSON every this many decisions, to prove resume is exact. */
  resumeEvery?: number;
  /** Chance per waking decision of considering the sat phone at all. Default: never. */
  tapOutChance?: number;
}

export interface LockstepResult {
  seed: number | string;
  decisions: Decision[];
  divergence: Divergence | null;
  finalDay: number;
  over: boolean;
  cause: string;
  draws: number;
  handlersSeen: Set<string>;
}

class PortSide {
  modal: string | null = null;
  constructor(public run: Run) {
    setPresenter({
      showModal: (html) => {
        this.modal = html;
      },
      hideModal: () => {
        this.modal = null;
      },
    });
  }

  click(handler: string): void {
    const calls = parseHandler(handler);
    if (!calls) throw new Error(`Cannot replay handler: ${handler}`);
    for (const call of calls) {
      if (call.fn === 'hideModal') this.modal = null;
      else if (call.fn === 'skipTypewriter') continue;
      else this.run.call(call.fn, ...call.args);
    }
  }
}

function pickWeighted<T>(rng: RngState, items: Array<[T, number]>): T | null {
  const total = items.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return null;
  let roll = nextFloat(rng) * total;
  for (const [item, weight] of items) {
    roll -= weight;
    if (roll < 0) return item;
  }
  return items.at(-1)![0];
}

/**
 * The one place v12 bakes a function's source text into a button: the shot introspection modal
 * (`(() => { fireShot(); })()`). The port emits the bare call; both are the same click.
 */
export function normalizeModal(html: string | null): string | null {
  return html === null ? null : html.replace(/\(\(\)\s*=>\s*\{\s*(\w+)\(\);?\s*\}\)\(\)/g, '$1()');
}

const QUITTING = /endGame\('tap'\)|confirmTapOutStep2|confirmTapOut\b/;

/** The bot: chooses the next decision from what v12 offers, using the port's (identical) state. */
export function chooseDecision(port: PortSide, bot: RngState, options: LockstepOptions): Decision | null {
  const S = port.run.state;
  if (S.over && !port.modal) return null;

  if (port.modal) {
    let buttons = modalButtons(port.modal).filter((b) => !b.disabled && parseHandler(b.onclick));
    // v12's modal watchdog injects a Continue when nothing is clickable.
    if (buttons.length === 0) buttons = [{ label: 'Continue', onclick: 'hideModal()', disabled: false }];
    const staying = buttons.filter((b) => !QUITTING.test(b.onclick));
    const pool = staying.length > 0 ? staying : buttons;
    const choice = pickWeighted(bot, pool.map((b) => [b, b.onclick.trim() === 'hideModal()' ? 1 : 3]))!;
    return { handler: choice.onclick, label: `modal: ${choice.label}` };
  }

  if (options.persona === 'survivor' && nextFloat(bot) < 0.85) {
    const planned = survivorDecision(S);
    if (planned) return planned;
  }

  if (S.hour >= 16) {
    if (nextFloat(bot) < 0.75) return { handler: 'actSleep()', label: 'sleep' };
  }

  const candidates: Array<[Decision, number]> = [];
  for (const entry of actionPanel()) {
    if (!entry.visible || !entry.enabled) continue;
    candidates.push([{ handler: entry.onclick, label: entry.label }, 1]);
  }
  if (S.water > 0 && S.thirst < 70) candidates.push([{ handler: 'actDrink()', label: 'drink' }, 4]);
  if (S.hunger < 70) {
    candidates.push([{ handler: 'eatBerries()', label: 'eat berries' }, 2]);
    candidates.push([{ handler: 'eatCooked()', label: 'eat cooked' }, 2]);
    candidates.push([{ handler: 'eatSmoked()', label: 'eat smoked' }, 2]);
  }
  for (const loc of ['camp', 'shore', 'woods']) {
    if (loc !== S.loc) candidates.push([{ handler: `goTo('${loc}')`, label: `walk to ${loc}` }, 1.5]);
  }
  if (S.hour >= 12) candidates.push([{ handler: 'actTurnInEarly()', label: 'turn in early' }, 0.15]);
  if ((options.tapOutChance ?? 0) > 0 && nextFloat(bot) < options.tapOutChance!) {
    candidates.push([{ handler: 'confirmTapOut()', label: 'pick up the phone' }, 1]);
  }
  return pickWeighted(bot, candidates) ?? { handler: 'actSleep(true)', label: 'nothing left - turn in' };
}

/**
 * A plain, sensible player: keep water, food and fire going, build up camp, keep a trapline and
 * lines out, and be home with the fire lit by evening. Returns null when nothing on its list fits,
 * and the caller falls back to exploring.
 */
function survivorDecision(S: any): Decision | null {
  const panel = new Map(actionPanel().map((entry) => [entry.id, entry]));
  const ready = (id: string) => {
    const entry = panel.get(id);
    return entry && entry.enabled && entry.visible ? entry : null;
  };
  const exists = (id: string) => {
    const entry = panel.get(id);
    return entry && entry.enabled;
  };
  const act = (id: string): Decision | null => {
    const entry = ready(id);
    return entry ? { handler: entry.onclick, label: entry.label } : null;
  };
  const go = (loc: string): Decision => ({ handler: `goTo('${loc}')`, label: `walk to ${loc}` });
  const food = (S.meatQ?.length ?? 0) + (S.berryQ?.length ?? 0) + S.smoked + (S.cookedMeal ? 1 : 0);

  if (S.water > 0 && S.thirst < 60) return { handler: 'actDrink()', label: 'drink' };
  if (S.hunger < 55 && S.cookedMeal) return { handler: 'eatCooked()', label: 'eat cooked' };
  if (S.hunger < 50 && S.smoked > 0) return { handler: 'eatSmoked()', label: 'eat smoked' };
  if (S.hunger < 50 && (S.berryQ?.length ?? 0) > 0) return { handler: 'eatBerries()', label: 'eat berries' };

  const evening = S.hour >= 15.5;
  if (evening) {
    if (S.loc !== 'camp') return go('camp');
    const carrying = S.carry.wood + S.carry.rocks + S.carry.moss + S.carry.clay > 0;
    if (carrying) return act('a-dropoff');
    if (S.fireH < 3) return act('a-fire') ?? { handler: 'actSleep()', label: 'sleep' };
    if (S.hour >= 16) return { handler: 'actSleep()', label: 'sleep' };
    return act('a-rest') ?? act('a-sitwatch');
  }

  const carrying = S.carry.wood + S.carry.rocks + S.carry.moss + S.carry.clay;
  if (S.loc === 'camp') {
    if (carrying > 0) return act('a-dropoff');
    const order = ['a-fire', 'a-boil', 'a-cook', 'a-smoke', 'a-smokeHuge', 'a-shelter', 'a-dugout', 'a-firepit', 'a-insulate', 'a-rack', 'a-cache', 'a-jug', 'a-picker', 'a-bed', 'a-chair', 'a-table', 'a-flute', 'a-haftAxe', 'a-repairBoots', 'a-patchRoof', 'a-poultice', 'a-sharpenAxe', 'a-maintainFerro', 'a-campSnares', 'a-treemark', 'a-confess', 'a-wash', 'a-haul', 'a-carve'];
    for (const id of order) {
      if (id === 'a-fire' && S.fireH > 2) continue;
      const d = act(id);
      if (d) return d;
    }
    if (S.stock.firewood < 6) return act('a-woodCamp') ?? go('woods');
    if (S.rawWater < 2 || S.water < 2) return go('shore');
    return go(food < 4 ? (S.lineList.length > 0 || S.net.built ? 'shore' : 'woods') : 'woods');
  }
  if (S.loc === 'shore') {
    if (carrying >= 4) return go('camp');
    const order = ['a-checkShore', 'a-fetch', 'a-lines', 'a-iceLine', 'a-net', 'a-iceCache', 'a-iceFish', 'a-rocks', 'a-clay', 'a-haul', 'a-carve'];
    for (const id of order) {
      if (id === 'a-fetch' && S.rawWater >= 3) continue;
      if ((id === 'a-rocks' || id === 'a-clay') && S.stock.rocks + S.stock.clay > 14) continue;
      const d = act(id);
      if (d) return d;
    }
    return go(exists('a-follow') ? 'woods' : 'woods');
  }
  // woods
  if (carrying >= 5) return go('camp');
  const order = ['a-checkTraps', 'a-follow', 'a-shot', 'a-trail', 'a-carve', 'a-haul', 'a-snare', 'a-forage', 'a-wood', 'a-firewood', 'a-moss', 'a-scout', 'a-tinder', 'a-invest'];
  for (const id of order) {
    if (id === 'a-firewood' && S.stock.firewood > 14) continue;
    if (id === 'a-moss' && S.stock.moss > 12) continue;
    if (id === 'a-tinder' && S.tinder > 6) continue;
    const d = act(id);
    if (d) return d;
  }
  return go('camp');
}

export function runLockstep(start: LegacyStartOptions, options: LockstepOptions): LockstepResult {
  const legacy: LegacyGame = loadLegacyGame(start);
  const port = new PortSide(startRun(resolveRunOptions(start)));
  const bot = createRngState(`${String(start.seed)}::bot`);
  const decisions: Decision[] = [];
  const handlersSeen = new Set<string>();
  const maxDecisions = options.maxDecisions ?? 5000;

  const compare = (label: string): Divergence | null => {
    const diff = firstDifference(plain(legacy.read('S')), plain(port.run.state));
    if (diff) return { step: decisions.length, label, path: diff.path, legacy: diff.a, port: diff.b };
    if (legacy.rng.draws !== port.run.rng.draws) {
      return { step: decisions.length, label, path: '(random draws)', legacy: legacy.rng.draws, port: port.run.rng.draws };
    }
    if (normalizeModal(legacy.modal()) !== port.modal) {
      return { step: decisions.length, label, path: '(modal)', legacy: legacy.modal(), port: port.modal };
    }
    return null;
  };

  let divergence = compare('start');
  while (!divergence && decisions.length < maxDecisions) {
    const S = port.run.state;
    if (S.day > options.days && !port.modal) break;
    const decision = chooseDecision(port, bot, options);
    if (!decision) break;
    decisions.push(decision);
    handlersSeen.add(decision.handler.replace(/\(.*$/s, '').replace(/^hideModal\(\); /, ''));
    legacy.run(decision.handler);
    port.click(normalizeModal(decision.handler)!);
    if (options.resumeEvery && decisions.length % options.resumeEvery === 0) {
      port.run = restoreRun(JSON.parse(JSON.stringify(snapshotRun(port.run))));
    }
    divergence = compare(decision.label);
  }

  return {
    seed: start.seed,
    decisions,
    divergence,
    finalDay: port.run.state.day,
    over: !!port.run.state.over,
    cause: port.run.state.cause,
    draws: port.run.rng.draws,
    handlersSeen,
  };
}
