// Intended-difference tests for the parents / no-contact thread (plan §8.4, rule homeThread):
// it never exists in v12 mode, it opens only after several hard nights, moves one stage at a
// time, wears at resolve only from stage 2, and ends in the Waiver card. Its forced tap-out
// needs the card first, and names the parents, never Mara.
import { beforeEach, describe, expect, it } from 'vitest';
import { setPresenter, startRun, TAPOUT_RULES, V12_RULES, type Run, type RuleSet } from '@tapout/core';
import { CAST, HOME_THREAD } from '@tapout/content';

let modal: string | null = null;
beforeEach(() => {
  modal = null;
  setPresenter({ showModal: (html) => (modal = html), hideModal: () => (modal = null), typewriterInto: () => undefined });
});

function start(rules: Readonly<RuleSet> = TAPOUT_RULES, cast = CAST): Run {
  return startRun({ seed: 'home', kit: ['axe', 'saw', 'ferro', 'pot', 'knife', 'sleeping', 'tarp', 'line', 'snare', 'bow'], backstory: { who: 'partner', fear: 'failing' }, name: 'Dan', heightCm: 178, startWeightKg: 88, sex: 'man', rules, cast });
}

/** Makes tonight about as bad as it gets: Breaking resolve, morale gone. */
function hard(run: Run): void {
  run.state.resolve = 5;
  run.state.resolveState = 'Breaking';
  run.state.morale = 10;
}

function tick(run: Run): string[] {
  const notes: string[] = [];
  run.state.day += 1;
  run.call('homeThreadTick', notes);
  return notes;
}

const t = HOME_THREAD.tuning;

describe('thoughts of home', () => {
  it('does not exist in v12 mode or without its words', () => {
    for (const run of [start(V12_RULES), start(TAPOUT_RULES, { ...CAST, home: undefined })]) {
      hard(run);
      for (let i = 0; i < 6; i++) tick(run);
      expect(run.state.home).toBeUndefined();
    }
  });

  it('needs several hard nights in a row before anything moves', () => {
    const run = start();
    hard(run);
    for (let i = 0; i < t.gateNights - 1; i++) tick(run);
    expect(run.state.home.pressure).toBe(0);
    tick(run);
    expect(run.state.home.pressure).toBeGreaterThan(0);
  });

  it('closes again on a calm night and the pressure drains', () => {
    const run = start();
    hard(run);
    for (let i = 0; i < t.gateNights + 2; i++) tick(run);
    const before = run.state.home.pressure;
    run.state.resolve = 80;
    run.state.resolveState = 'Steady';
    run.state.morale = 70;
    tick(run);
    expect(run.state.home.gateNights).toBe(0);
    expect(run.state.home.pressure).toBeLessThan(before);
  });

  it('moves one stage at a time, never faster than the beat gap, with plain lines', () => {
    const run = start();
    hard(run);
    for (let i = 0; i < t.gateNights; i++) tick(run);
    run.state.home.pressure = 100;
    const stages: number[] = [];
    const lines: string[] = [];
    for (let i = 0; i < 8; i++) {
      run.state.home.pressure = 100;
      lines.push(...tick(run));
      stages.push(run.state.home.stage);
    }
    for (let i = 1; i < stages.length; i++) expect(stages[i]! - stages[i - 1]!).toBeLessThanOrEqual(1);
    expect(stages.at(-1)).toBe(4);
    expect(lines.filter((l) => l.includes('🏠') || l.includes('💤')).length).toBeGreaterThanOrEqual(3);
    for (const l of lines) expect(l).not.toMatch(/!|Mara/);
  });

  it('wears at resolve only from stage 2, and shows a condition then', () => {
    const run = start();
    hard(run);
    for (let i = 0; i < t.gateNights; i++) tick(run);
    run.state.home.stage = 1;
    run.state.home.lastBeatDay = run.state.day;
    run.state.resolve = 50;
    tick(run);
    expect(run.state.resolve).toBe(50);
    run.state.home.stage = 2;
    run.state.home.lastBeatDay = run.state.day;
    tick(run);
    expect(run.state.resolve).toBeLessThan(50);
    expect(run.state.modifiers.some((m: { id: string }) => m.id === 'thoughtsOfHome')).toBe(true);
  });

  it('ends in the Waiver card; accepting it settles the thread', () => {
    const run = start();
    run.state.home = undefined;
    hard(run);
    tick(run);
    Object.assign(run.state.home, { stage: 4, pressure: 95 });
    run.call('homeCardTick');
    expect(run.state._pendingCard.id).toBe('waiver');
    run.call('showCard', run.state._pendingCard);
    expect(modal).toContain(HOME_THREAD.lines.card.accept);
    run.state._pendingCard = null;
    const resolveBefore = run.state.resolve;
    run.call('resolveCardChoice', 'waiver', 0);
    expect(run.state.home.closure).toBe('accepted');
    expect(run.state.home.pressure).toBe(t.accepted.pressure);
    expect(run.state.home.stage).toBe(3);
    expect(run.state.resolve).toBeGreaterThan(resolveBefore);
  });

  it('lets you pick up the phone from the card, and put it down again', () => {
    const run = start();
    hard(run);
    tick(run);
    Object.assign(run.state.home, { stage: 4, cardShown: true });
    run.call('resolveCardChoice', 'waiver', 2);
    expect(modal).toContain('sat phone');
    expect(run.state.over).toBeFalsy();
  });

  it('"Not now" brings the card back once, a few days later', () => {
    const run = start();
    hard(run);
    tick(run);
    Object.assign(run.state.home, { stage: 4 });
    run.call('homeCardTick');
    run.state._pendingCard = null;
    run.call('resolveCardChoice', 'waiver', 3);
    run.call('homeCardTick');
    expect(run.state._pendingCard).toBeFalsy();
    run.state.day += t.cardReturn;
    run.call('homeCardTick');
    expect(run.state._pendingCard?.id).toBe('waiver');
    run.state._pendingCard = null;
    run.state.day += t.cardReturn;
    run.call('homeCardTick');
    expect(run.state._pendingCard).toBeFalsy();
  });

  it('forces a tap-out only after the card, and names the parents, never Mara', () => {
    const run = start();
    hard(run);
    tick(run);
    Object.assign(run.state.home, { stage: 4, lastBeatDay: run.state.day });
    for (let i = 0; i < t.breakNights + 1; i++) tick(run);
    expect(run.state.forcedTapoutPending).toBeFalsy();
    run.state.home.cardShown = true;
    tick(run);
    expect(run.state.forcedTapoutPending).toBe(true);
    const cause = run.call<string>('forcedTapCause');
    expect(cause).toBe(HOME_THREAD.lines.forcedTap);
    expect(cause).not.toMatch(/Mara|partner/);
  });

  it('eases when you talk to the camera or sit a while', () => {
    const run = start();
    hard(run);
    tick(run);
    Object.assign(run.state.home, { stage: 2, pressure: 50 });
    run.state.loc = 'camp';
    run.state.energy = 100;
    run.call('actConfess');
    expect(run.state.home.pressure).toBe(50 - t.confess);
    expect(run.state.confessionals.at(-1).text).toMatch(/Mum|Dad/);
    run.call('actSitWatch');
    expect(run.state.home.pressure).toBe(50 - t.confess - t.sit);
  });
});
