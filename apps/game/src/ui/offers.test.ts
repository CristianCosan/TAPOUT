import { describe, expect, it } from 'vitest';
import { LOCATIONS, type LocationId } from '@tapout/content';
import { Session, type View } from '../session.ts';
import { offersFor } from './offers.ts';

// Plays whole runs through the same offers the screen shows (plan §12, M10): every action v12
// shows is on a station you can click, and every offer resolves without an error.

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
}

function modalHandlers(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<button([^>]*)onclick="([^"]*)"/g)) {
    if (/\sdisabled/.test(m[1]!)) continue;
    out.push(m[2]!.replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
  }
  return out;
}

function play(seed: number, steps: number) {
  const session = new Session(null);
  session.newRun(['axe', 'saw', 'ferro', 'pot', 'knife', 'sleeping', 'tarp', 'line', 'snare', 'bow'], `offers-${seed}`);
  const rnd = rng(seed);
  const used = new Set<string>();
  let results = 0;
  for (let i = 0; i < steps; i++) {
    const view = session.getView() as View;
    if (view.state.over) break;
    if (view.result) results++;
    if (view.modal) {
      const handlers = modalHandlers(view.modal).filter((h) => !/tap|Tap/.test(h));
      const all = handlers.length ? handlers : modalHandlers(view.modal);
      if (!all.length) throw new Error(`modal with no button: ${view.modal.slice(0, 200)}`);
      session.click(all[Math.floor(rnd() * all.length)]!);
      continue;
    }
    const loc = view.state.loc as LocationId;
    const layout = LOCATIONS[loc];
    // Every action v12 offers here sits on some station of this location.
    const placed = new Set(layout.stations.flatMap((s) => s.actions));
    for (const entry of view.panel) {
      if (!entry.visible || (entry.loc !== loc && entry.loc !== 'all')) continue;
      expect(placed.has(entry.id), `${entry.id} has no station at ${loc}`).toBe(true);
    }
    const offers = layout.stations.flatMap((s) => offersFor(s, view)).filter((o) => o.enabled && !o.ui);
    const pick = offers[Math.floor(rnd() * offers.length)];
    if (!pick) throw new Error(`nothing to do at ${loc}, day ${view.state.day} ${view.state.hour}`);
    used.add(pick.key);
    session.click(pick.handler);
  }
  return { used, results, view: session.getView() as View };
}

describe('the location screens', () => {
  it('reach and resolve every offer through whole runs', () => {
    const used = new Set<string>();
    let results = 0;
    for (const seed of [11, 23, 37, 41]) {
      const run = play(seed, 900);
      run.used.forEach((k) => used.add(k));
      results += run.results;
    }
    // A random player uses most of what camp offers.
    const campActions = LOCATIONS.camp.stations.flatMap((s) => [...s.actions, ...(s.special ?? [])]);
    const usedAtCamp = campActions.filter((a) => used.has(a));
    expect(usedAtCamp.length).toBeGreaterThan(campActions.length * 0.4);
    expect(results).toBeGreaterThan(50);
  });
});

describe('fishing spots', () => {
  it('set a line at the spot you clicked, then show it is out there', () => {
    const session = new Session(null);
    session.newRun(['axe', 'saw', 'ferro', 'pot', 'knife', 'sleeping', 'tarp', 'line', 'snare', 'bow'], 'spots');
    session.click("goTo('shore')");
    while ((session.getView() as View).modal) session.click('hideModal()');
    const inlet = LOCATIONS.shore.stations.find((s) => s.id === 'inlet')!;
    const set = offersFor(inlet, session.getView() as View).find((o) => o.key === 'a-lines')!;
    expect(set.handler).toBe("placeLineAt('inlet')");
    session.click(set.handler);
    const view = session.getView() as View;
    expect(view.state.lineList).toEqual([expect.objectContaining({ spotId: 'inlet' })]);
    const after = offersFor(inlet, view).find((o) => o.key === 'a-lines')!;
    expect(after.enabled).toBe(false);
    // Other spots still offer a line of their own.
    const point = LOCATIONS.shore.stations.find((s) => s.id === 'point')!;
    expect(offersFor(point, view).find((o) => o.key === 'a-lines')!.handler).toBe("placeLineAt('point')");
  });
});
