// One run, as the UI sees it: the ported v12 simulation, what it is currently showing (a modal,
// text it typed into the page, the end screen), and an autosave after every click.
//
// v12 talks to the page through a handful of presenter calls. This module is that page: it
// records what v12 asked to show and hands React a fresh snapshot after every change.

import {
  actionPanel,
  hudRecord,
  type HudElement,
  parseHandler,
  restoreRun,
  setPresenter,
  snapshotRun,
  startRun,
  type PanelEntry,
  type Run,
  type RunSnapshot,
} from '@tapout/core';
import { CAST, P1 } from '@tapout/content';

export interface PageElement {
  id: string;
  innerHTML?: string;
  textContent?: string;
  classes: Set<string>;
  disabled?: boolean;
}

export interface View {
  // v12 state is untyped until its systems are refactored (docs/spec/PORT.md).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any;
  panel: PanelEntry[];
  hud: ReadonlyMap<string, HudElement>;
  modal: string | null;
  elements: ReadonlyMap<string, PageElement>;
  endScreen: boolean;
  /** What the last action did, once it has finished (no modal left open). */
  result: ActionResult | null;
  version: number;
}

/** A plain before/after diff of one action, for the result card. No rules: just numbers that moved. */
export interface ActionResult {
  id: number;
  lines: Array<{ msg: string; cls: string }>;
  bars: Record<string, number>;
  stores: Record<string, number>;
  minutes: number;
}

interface Baseline {
  bars: Record<string, number>;
  stores: Record<string, number>;
  hours: number;
  topLine: unknown;
}

const RESULT_BARS = ['energy', 'health', 'hunger', 'thirst', 'warmth', 'morale', 'stress'] as const;

interface SaveFile {
  format: 'tapout-save';
  version: 1;
  savedAt: string;
  run: RunSnapshot;
  modal: string | null;
  elements: Array<[string, Omit<PageElement, 'classes'> & { classes: string[] }]>;
}

const SAVE_KEY = 'tapout.run';
const HISTORY_KEY = 'tapout.history';
const HISTORY_MAX = 30;

/** One finished run, for the title screen's list of past runs. */
export interface RunRecord {
  endedAt: string;
  day: number;
  title: string;
  cause: string;
}
// Elements v12 expects to start hidden, as they do in its page markup.
const STARTS_HIDDEN = new Set(['endScreen', 'endStats']);

function newElement(id: string): PageElement {
  return { id, classes: new Set(STARTS_HIDDEN.has(id) ? ['hidden'] : []) };
}

export class Session {
  private run: Run | null = null;
  private modal: string | null = null;
  private elements = new Map<string, PageElement>();
  private listeners = new Set<() => void>();
  private view: View | null = null;
  private version = 0;
  private baseline: Baseline | null = null;
  /** The finished run has been written to the history. */
  private recorded = false;
  private result: ActionResult | null = null;
  /** Layout-guide runs are never saved. */
  private throwaway = false;

  constructor(private readonly storage: Storage | null) {
    setPresenter({
      showModal: (html) => {
        this.modal = html;
        // A new modal starts with a fresh page underneath it.
        for (const id of [...this.elements.keys()]) if (!id.startsWith('end')) this.elements.delete(id);
      },
      hideModal: () => {
        this.modal = null;
      },
      typewriterInto: (id, text) => {
        this.element(id).textContent = text;
      },
      element: (id) => this.domLike(id),
    });
  }

  // ---- lifecycle

  hasSave(): boolean {
    return this.readSave() !== null;
  }

  /** A run that only exists to show a location's layout guide (`#guide-camp`). */
  startGuide(loc: string): void {
    this.newRun(['axe', 'saw', 'ferro', 'pot', 'knife', 'sleeping', 'tarp', 'line', 'snare', 'bow'], 'layout-guide', true);
    this.run!.state.loc = loc;
    this.emit();
  }

  newRun(kit: readonly string[], seed: string = String(Date.now()), throwaway = false): void {
    this.reset();
    this.throwaway = throwaway;
    this.run = startRun({
      seed,
      kit,
      backstory: { who: 'partner', fear: P1.fear },
      name: P1.displayName,
      heightCm: P1.heightCm,
      startWeightKg: P1.startWeightKg,
      sex: 'man',
      cast: CAST,
    });
    this.afterChange();
  }

  continueRun(): boolean {
    const save = this.readSave();
    if (!save) return false;
    this.reset();
    this.run = restoreRun(save.run);
    this.modal = save.modal;
    for (const [id, el] of save.elements) this.elements.set(id, { ...el, classes: new Set(el.classes) });
    this.afterChange();
    return true;
  }

  leaveRun(): void {
    this.reset();
    this.emit();
  }

  /** Runs a v12 handler, exactly as clicking that button in v12 would. */
  click(handler: string): void {
    if (!this.run) return;
    const calls = parseHandler(handler);
    if (!calls) {
      console.warn('Unrecognised handler', handler);
      return;
    }
    // An action measured from the moment it starts until its last modal closes.
    if (!this.modal) {
      this.baseline = this.measure();
      this.result = null;
    }
    for (const call of calls) {
      if (call.fn === 'hideModal') this.modal = null;
      else if (call.fn === 'skipTypewriter' || call.fn === 'toggleEndStats') continue;
      else if (call.fn === 'restartRun') {
        this.leaveRun();
        return;
      } else this.run.call(call.fn, ...call.args);
    }
    if (!this.modal && this.baseline) {
      this.result = this.diff(this.baseline);
      this.baseline = null;
    }
    this.afterChange();
  }

  /** Puts the result card away. */
  dismissResult(): void {
    if (!this.result) return;
    this.result = null;
    this.emit();
  }

  private measure(): Baseline {
    const S = this.run!.state;
    const bars: Record<string, number> = {};
    for (const key of RESULT_BARS) bars[key] = Number(S[key]) || 0;
    const stores: Record<string, number> = {};
    for (const [id, el] of hudRecord()) {
      if (!id.startsWith('inv-')) continue;
      const n = parseInt(el.text, 10);
      if (Number.isFinite(n)) stores[id] = n;
    }
    stores['water'] = Number(S.water) || 0;
    return { bars, stores, hours: S.day * 24 + S.hour, topLine: S.log[0] };
  }

  private diff(before: Baseline): ActionResult | null {
    const after = this.measure();
    const S = this.run!.state;
    const lines: Array<{ msg: string; cls: string }> = [];
    for (const line of S.log as Array<{ msg: string; cls: string }>) {
      if (line === before.topLine) break;
      lines.unshift({ msg: line.msg, cls: line.cls });
    }
    const delta = (a: Record<string, number>, b: Record<string, number>) => {
      const out: Record<string, number> = {};
      for (const key of Object.keys(b)) {
        const d = Math.round(((b[key] ?? 0) - (a[key] ?? 0)) * 10) / 10;
        if (d !== 0) out[key] = d;
      }
      return out;
    };
    const minutes = Math.round((after.hours - before.hours) * 60);
    const result = { id: this.version, lines, bars: delta(before.bars, after.bars), stores: delta(before.stores, after.stores), minutes };
    return lines.length || minutes > 0 || Object.keys(result.bars).length || Object.keys(result.stores).length ? result : null;
  }

  // ---- React binding

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getView = (): View | null => this.view;

  // ---- internals

  private reset(): void {
    this.run = null;
    this.recorded = false;
    this.baseline = null;
    this.result = null;
    this.modal = null;
    this.elements.clear();
  }

  private element(id: string): PageElement {
    let el = this.elements.get(id);
    if (!el) {
      el = newElement(id);
      this.elements.set(id, el);
    }
    return el;
  }

  /** The shape v12's `$()` callers use, backed by a recorded element. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors the loose DOM shape v12 writes to
  private domLike(id: string): any {
    const el = this.element(id);
    return {
      get innerHTML() {
        return el.innerHTML ?? '';
      },
      set innerHTML(v: string) {
        el.innerHTML = v;
      },
      get textContent() {
        return el.textContent ?? '';
      },
      set textContent(v: string) {
        el.textContent = String(v);
      },
      set className(v: string) {
        el.classes = new Set(v.split(/\s+/).filter(Boolean));
      },
      set disabled(v: boolean) {
        el.disabled = v;
      },
      style: {},
      classList: {
        add: (...n: string[]) => n.forEach((x) => el.classes.add(x)),
        remove: (...n: string[]) => n.forEach((x) => el.classes.delete(x)),
        toggle: (n: string, force?: boolean) => {
          const on = force ?? !el.classes.has(n);
          if (on) el.classes.add(n);
          else el.classes.delete(n);
          return on;
        },
        contains: (n: string) => el.classes.has(n),
      },
      setAttribute: () => {},
      appendChild: (child: unknown) => child,
      querySelectorAll: () => [],
    };
  }

  private afterChange(): void {
    this.autosave();
    this.emit();
    if (this.view?.endScreen && !this.recorded) this.record();
  }

  /** Past runs, newest first. */
  history(): RunRecord[] {
    try {
      const raw = this.storage?.getItem(HISTORY_KEY);
      const list = raw ? (JSON.parse(raw) as RunRecord[]) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  private record(): void {
    this.recorded = true;
    if (!this.storage || this.throwaway || !this.run) return;
    const text = (id: string) => (this.elements.get(id)?.textContent ?? '').trim();
    const entry: RunRecord = { endedAt: new Date().toISOString(), day: this.run.state.day, title: text('endTitle'), cause: text('endCause') };
    try {
      this.storage.setItem(HISTORY_KEY, JSON.stringify([entry, ...this.history()].slice(0, HISTORY_MAX)));
    } catch (error) {
      console.error('Could not record the run', error);
    }
  }

  private emit(): void {
    this.version += 1;
    if (this.run) {
      this.view = {
        state: this.run.state,
        panel: actionPanel(),
        hud: hudRecord(),
        modal: this.modal,
        elements: new Map(this.elements),
        endScreen: this.elements.has('endScreen') && !this.elements.get('endScreen')!.classes.has('hidden'),
        result: this.result,
        version: this.version,
      };
    } else this.view = null;
    this.listeners.forEach((listener) => listener());
  }

  private autosave(): void {
    if (!this.storage || !this.run || this.throwaway) return;
    try {
      // One save per run: a run that has ended cannot be continued.
      if (this.run.state.over) {
        this.storage.removeItem(SAVE_KEY);
        return;
      }
      const save: SaveFile = {
        format: 'tapout-save',
        version: 1,
        savedAt: new Date().toISOString(),
        run: snapshotRun(this.run),
        modal: this.modal,
        elements: [...this.elements].map(([id, el]) => [id, { ...el, classes: [...el.classes] }]),
      };
      this.storage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (error) {
      console.error('Autosave failed', error);
    }
  }

  private readSave(): SaveFile | null {
    try {
      const raw = this.storage?.getItem(SAVE_KEY);
      if (!raw) return null;
      const save = JSON.parse(raw) as SaveFile;
      if (save.format !== 'tapout-save' || save.version !== 1) return null;
      if ((save.run.state as { over?: boolean }).over) return null;
      return save;
    } catch {
      return null;
    }
  }
}

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const session = new Session(safeStorage());
