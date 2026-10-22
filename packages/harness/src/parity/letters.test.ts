// Intended-difference tests for letters and the call home (rule letters, M18): you can write to
// Mara or to your parents at your pack, it never costs resolve, the letter home is once per run
// and eases thoughts of home, and every ending but a violent death passes through the call home.
import { beforeEach, describe, expect, it } from 'vitest';
import { actionPanel, restoreRun, setPresenter, snapshotRun, startRun, TAPOUT_RULES, V12_RULES, type Run, type RuleSet } from '@tapout/core';
import { CAST, HOME_THREAD } from '@tapout/content';

let modal: string | null = null;
const typed: string[] = [];
beforeEach(() => {
  modal = null;
  typed.length = 0;
  setPresenter({ showModal: (html) => (modal = html), hideModal: () => (modal = null), typewriterInto: (_id, text) => typed.push(text) });
});

function start(rules: Readonly<RuleSet> = TAPOUT_RULES): Run {
  const run = startRun({ seed: 'letters', kit: ['axe', 'saw', 'ferro', 'pot', 'knife', 'sleeping', 'tarp', 'line', 'snare', 'bow'], backstory: { who: 'partner', fear: 'failing' }, name: 'Dan', heightCm: 178, startWeightKg: 88, sex: 'man', rules, cast: CAST });
  run.state.loc = 'camp';
  run.state.hour = 10;
  run.state.energy = 100;
  return run;
}

const letters = (run: Run) => actionPanel().filter((e) => e.id.startsWith('a-letter') && run.state.loc === 'camp');

describe('letters you write yourself', () => {
  it('are offered at camp only in TAP / OUT', () => {
    start(V12_RULES);
    expect(actionPanel().some((e) => e.id.startsWith('a-letter'))).toBe(false);
    const run = start();
    const offered = letters(run);
    expect(offered.map((e) => e.label)).toEqual([HOME_THREAD.letters.toPartner, HOME_THREAD.letters.toParents]);
    expect(offered.every((e) => e.visible && e.enabled)).toBe(true);
  });

  it('to Mara: a small lift, never a resolve cost, one a day', () => {
    const run = start();
    const morale = run.state.morale;
    const resolve = run.state.resolve;
    run.call('actWriteLetter', 'partner');
    expect(run.state.letters.at(-1)).toMatchObject({ trigger: 'toPartner', written: true });
    expect(run.state.morale).toBeGreaterThan(morale);
    expect(run.state.resolve).toBeGreaterThanOrEqual(resolve);
    expect(letters(run).every((e) => !e.enabled)).toBe(true);
    run.call('actWriteLetter', 'partner');
    expect(run.state.letters.filter((l: { written?: boolean }) => l.written)).toHaveLength(1);
    run.state.day += 1;
    expect(letters(run)[0]!.enabled).toBe(true);
  });

  it('to your parents: once per run, and it eases thoughts of home', () => {
    const run = start();
    run.state.home = undefined;
    run.call('homeState');
    Object.assign(run.state.home, { stage: 2, pressure: 60 });
    run.call('actWriteLetter', 'parents');
    expect(run.state.home.pressure).toBe(60 - HOME_THREAD.letters.parentsRelief);
    expect(run.state.letters.at(-1).text).toBe(HOME_THREAD.letters.parents.worried);
    run.state.day += 1;
    expect(letters(run).find((e) => e.id === 'a-letterParents')!.visible).toBe(false);
  });

  it('still work after the run is saved and continued', () => {
    const saved = JSON.parse(JSON.stringify(snapshotRun(start())));
    const run = restoreRun(saved);
    run.call('actWriteLetter', 'partner');
    expect(run.state.letters.at(-1)).toMatchObject({ written: true });
    expect(run.state.log.some((l: { msg: string }) => l.msg.includes('You write to Mara'))).toBe(true);
    // A save from 0.0.10-0.0.17 has no heading (it was a function, and JSON dropped it).
    const old = restoreRun(saved);
    delete old.state.cast.home.letters.heading;
    old.call('actWriteLetter', 'partner');
    expect(old.state.letters.at(-1)).toMatchObject({ written: true });
  });

  it('do not use up the letters that write themselves', () => {
    const run = start();
    for (let i = 0; i < 3; i++) {
      run.state.day += 1;
      run.state.energy = 100;
      run.call('actWriteLetter', 'partner');
    }
    const notes: string[] = [];
    run.call('maybeWriteLetter', 'awe', notes);
    expect(notes.some((n) => n.includes('writes a letter'))).toBe(true);
  });
});

describe('the call home', () => {
  it('comes before the final screen in TAP / OUT, not in v12', () => {
    start(V12_RULES).call('showLossStep5', 'tap');
    expect(modal).toContain("showFinalStatsScreen('tap')");
    start().call('showLossStep5', 'tap');
    expect(modal).toContain("showCallHome('tap')");
  });

  it('Mara answers after a tap-out; your parents too once you wrote or worried', () => {
    const run = start();
    run.call('showCallHome', 'tap');
    expect(modal).toContain(HOME_THREAD.callHome.title);
    expect(typed.at(-1)).toContain('Mara');
    expect(typed.at(-1)).not.toContain('landline');
    run.call('actWriteLetter', 'parents');
    run.call('showCallHome', 'med');
    expect(typed.at(-1)).toContain('landline');
  });

  it('after a win you ring your parents; a violent death has no call', () => {
    const run = start();
    run.call('showCallHome', 'win');
    expect(typed.at(-1)).toContain('I won');
    run.state.deathSource = 'violent';
    typed.length = 0;
    modal = null;
    run.call('showCallHome', 'dead');
    expect(modal ?? '').not.toContain(HOME_THREAD.callHome.title);
  });
});
