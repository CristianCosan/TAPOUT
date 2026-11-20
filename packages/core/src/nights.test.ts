// Intended difference (Sir 2026-11-20, sirNights): a card when it gets dark, dearer work after dark,
// a midnight hard stop that sends you to bed, and every morning at dawn. v12 keeps its own nights.
import { describe, expect, it } from 'vitest';
import { dawnHour, setPresenter, startRun, TAPOUT_RULES, V12_RULES, type RuleSet } from './game.ts';
import { darkHour, nightEnergyMul } from './v12/nights.ts';
import { eCost } from './v12/cost.ts';
import { hudRecord } from './v12/panel.ts';

let modal: string | null = null;
setPresenter({ showModal: (h: string) => { modal = h; }, hideModal: () => { modal = null; }, typewriterInto: () => {} });
const kit = ['axe', 'saw', 'pot', 'bag', 'ferro', 'bow', 'line', 'wire', 'mace', 'multitool'];
const start = (rules: Readonly<RuleSet>) => startRun({ seed: 'nights', kit, backstory: { who: 'partner', fear: 'failing' }, name: 'Dan', heightCm: 178, startWeightKg: 88, sex: 'man', rules });

describe('sirNights', () => {
  it('dark comes at 20:00 on day 1', () => {
    start(TAPOUT_RULES);
    expect(darkHour()).toBeCloseTo(20, 5);
  });
  it('work costs more after dark, more each hour, up to double; v12 is unchanged', () => {
    const run = start(TAPOUT_RULES);
    const at = (h: number) => { run.state.hour = h; return nightEnergyMul(); };
    expect(at(19.5)).toBe(1);
    expect(at(20.2)).toBeCloseTo(1.2);
    expect(at(22.1)).toBeCloseTo(1.5);
    expect(at(29)).toBe(2);
    run.state.hour = 22.1;
    expect(eCost(10, '')).toBe(15);
    const v = start(V12_RULES);
    v.state.hour = 22.1;
    expect(nightEnergyMul()).toBe(1);
    expect(eCost(10, '')).toBe(10);
  });
  it('says it is getting dark once a day, and sends you to bed at midnight', () => {
    const run = start(TAPOUT_RULES);
    run.state.hour = 20.5; modal = null;
    expect(run.call('nightCheck')).toBe(true);
    expect(modal).toContain("It's getting dark");
    modal = null;
    expect(run.call('nightCheck')).toBe(false);
    run.state.hour = 24.1; run.state.loc = 'woods';
    expect(run.call('nightCheck')).toBe(true);
    expect(modal).toContain('drag your tired body back to the shelter');
    expect(modal).toContain('forcedSleep()');
  });
  it('wakes at dawn, and heavier after the hard stop', () => {
    const a = start(TAPOUT_RULES);
    Object.assign(a.state, { hour: 20, loc: 'camp' });
    a.call('actSleep');
    expect(a.state.day).toBe(2);
    expect(a.state.hour).toBeGreaterThanOrEqual(dawnHour());
    expect(a.state.hour).toBeLessThan(dawnHour() + 3.01);
    const normal = a.state.energy;
    const b = start(TAPOUT_RULES);
    Object.assign(b.state, { hour: 20, loc: 'woods' });
    b.call('forcedSleep');
    expect(b.state.day).toBe(2);
    expect(b.state.loc).toBe('camp');
    expect(b.state.energy).toBeLessThan(normal);
  });
  it('v12 still wakes six hours after bedtime', () => {
    const v = start(V12_RULES);
    Object.assign(v.state, { hour: 17, loc: 'camp' });
    v.call('actSleep');
    expect(v.state.hour).toBeGreaterThanOrEqual(23);
  });
});

describe('sirNights on old saves', () => {
  it('a TAP / OUT run saved before the rule existed gets it; a v12 run does not', async () => {
    const { restoreRun, snapshotRun } = await import('./game.ts');
    const run = start(TAPOUT_RULES);
    const snap = snapshotRun(run);
    delete (snap.rules as Partial<RuleSet>).sirNights;
    expect(restoreRun(snap).rules.sirNights).toBe(true);
    const v = snapshotRun(start(V12_RULES));
    delete (v.rules as Partial<RuleSet>).sirNights;
    expect(restoreRun(v).rules.sirNights).toBe(false);
  });
  it('the Sleep button says you rest until dawn; v12 keeps its 6 hours', () => {
    start(TAPOUT_RULES).state.hour = 20.5;
    expect(hudRecord().get('sleep-sub')?.text).toBe('rest until dawn');
    start(V12_RULES).state.hour = 20.5;
    expect(hudRecord().get('sleep-sub')?.text).toBe('6 hours of rest, wherever bedtime lands you');
  });
});
