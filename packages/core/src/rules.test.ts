// Intended-difference tests for M8: each deliberate change to v12, shown against v12 itself.
// The parity tests prove everything else is still identical (they run with V12_RULES).

import { beforeEach, describe, expect, it } from 'vitest';
import { setPresenter, startRun, TAPOUT_RULES, V12_RULES, type RuleSet, type Run } from './game.ts';

const CAST = {
  partner: 'Mara',
  prizeLabel: '$400,000',
  rivals: { Dub: 'Doug Harlan', Timber: 'Birch Calloway', William: 'Willem Strand', Roland: 'Ronald Pike', Jordan: 'Jordie Lavelle', Callie: 'Cassie Moreau', Clay: 'Cole Brenner', Lucas: 'Luke Ostrander', Britt: 'Bree Halvorsen' },
};

let modal: string | null = null;
const typed: string[] = [];
beforeEach(() => {
  modal = null;
  typed.length = 0;
  setPresenter({
    showModal: (html) => (modal = html),
    hideModal: () => (modal = null),
    typewriterInto: (_id, text) => typed.push(text),
  });
});

function start(rules: Readonly<RuleSet>, kit: string[] = ['axe', 'saw', 'ferro', 'pot', 'knife', 'sleeping', 'tarp', 'line', 'snare', 'bow'], seed = 'rules'): Run {
  return startRun({ seed, kit, backstory: { who: 'partner', fear: 'failing' }, name: 'Dan', heightCm: 178, startWeightKg: 88, sex: 'man', rules, cast: CAST });
}

function logText(run: Run): string {
  return (run.state.log as Array<{ msg: string }>).map((l) => l.msg).join('\n');
}

describe('content: second person, the authored cast, no orcas', () => {
  it('names the rivals and the prize', () => {
    const v12 = start(V12_RULES);
    expect(v12.state.tapNames).toContain('Roland');
    const ours = start(TAPOUT_RULES);
    expect(ours.state.tapNames).toContain('Ronald Pike');
    expect(ours.state.tapNames).not.toContain('Roland');
  });

  it('tells the ankle break to you, not about him', () => {
    for (const [rules, expected] of [[V12_RULES, 'He asks himself'], [TAPOUT_RULES, 'You ask yourself']] as const) {
      const run = start(rules);
      run.state._pendingAnkleBreakCard = 'warmth';
      run.call('showAnkleBreakCard');
      expect(modal).toContain(expected);
    }
  });

  it('writes the unsent letters to Mara', () => {
    const run = start(TAPOUT_RULES);
    const notes: string[] = [];
    run.call('maybeWriteLetter', 'awe', notes);
    expect(notes[0]).toContain('writes a letter to Mara');
  });

  it('swims a moose through the narrows instead of orcas', () => {
    expect(start(TAPOUT_RULES).call<string>('say', 'orcas', 'moose')).toBe('moose');
    expect(start(V12_RULES).call<string>('say', 'orcas', 'moose')).toBe('orcas');
  });
});

describe('director: a weather front you can see coming, not a soaking', () => {
  for (const [name, rules] of [['v12', V12_RULES], ['TAP / OUT', TAPOUT_RULES]] as const) {
    it(name, () => {
      const run = start(rules);
      Object.assign(run.state, { highCIStreak: 2, warmth: 100, health: 100, morale: 100, smoked: 30, lastSetbackDay: -20, wet: 0 });
      const notes: string[] = [];
      run.call('directorTick', notes);
      if (rules === V12_RULES) {
        expect(run.state.wet).toBe(35);
        expect(run.state.weatherFront).toBeUndefined();
      } else {
        expect(run.state.wet).toBe(0);
        expect(run.state.weatherFront).toBe(true);
        expect(notes.join(' ')).toContain('Something is coming in tomorrow');
      }
    });
  }

  it('the front keeps the worse of two weather rolls', () => {
    const run = start(TAPOUT_RULES);
    expect(run.call('worseWeather', 'clear', 'storm')).toBe('storm');
    expect(run.call('worseWeather', 'rain', 'overcast')).toBe('rain');
  });
});

/** Sleeps through one night and returns the log. */
function night(run: Run, setup: Record<string, unknown>): string {
  Object.assign(run.state, { hour: 21 }, setup);
  run.call('actSleep');
  return logText(run);
}

describe('agency: nothing punishes ignoring a suggestion', () => {
  it('no camera nag or stress for days without a confessional', () => {
    const nag = /camera|lens|confessional/i;
    const setup = { day: 12, daysSinceConfess: 3 };
    // v12 nags on this night; TAP / OUT never does.
    expect(night(start(V12_RULES), setup).split('\n').some((l) => nag.test(l))).toBe(true);
    const ours = start(TAPOUT_RULES);
    night(ours, setup);
    expect(ours.state.daysSinceConfess).toBe(3);
  });

  it('no resolve cost for skipping the tree-mark post', () => {
    const setup = { day: 6, resolveState: 'Wavering', treeMarkedToday: false };
    expect(night(start(V12_RULES), setup)).toContain("You didn't mark the post yesterday");
    expect(night(start(TAPOUT_RULES), setup)).not.toContain("You didn't mark the post yesterday");
  });
});

describe('the medics check before the death verdict', () => {
  const crash = { day: 7, health: 3, hunger: 0, thirst: 0, warmth: 0 };
  it('v12: a crash on a check night is a death', () => {
    const run = start(V12_RULES);
    night(run, crash);
    expect(run.state.cause).toBe('dead');
  });
  it('TAP / OUT: the same night ends in a medical pull', () => {
    const run = start(TAPOUT_RULES);
    night(run, crash);
    expect(run.state.cause).toBe('med');
  });
  it('TAP / OUT: a crash on any other night is still a death', () => {
    const run = start(TAPOUT_RULES);
    night(run, { ...crash, day: 8 });
    expect(run.state.cause).toBe('dead');
  });
});

describe('legacy defects', () => {
  it('LEG-002: drafted rations are eight uses of +20 hunger', () => {
    const kit = ['axe', 'saw', 'ferro', 'pot', 'knife', 'sleeping', 'tarp', 'line', 'snare', 'rations'];
    const v12 = start(V12_RULES, kit);
    v12.state.hunger = 30;
    v12.call('eatRation');
    expect(v12.state.hunger).toBe(30);

    const ours = start(TAPOUT_RULES, kit);
    expect(ours.call('rationsLeft')).toBe(8);
    ours.state.hunger = 30;
    ours.call('eatRation');
    expect(ours.state.hunger).toBe(50);
    expect(ours.call('rationsLeft')).toBe(7);
    for (let i = 0; i < 10; i += 1) ours.call('eatRation');
    expect(ours.call('rationsLeft')).toBe(0);
  });

  it('LEG-005: one poultice dose is one action', () => {
    for (const [rules, count] of [[V12_RULES, 2], [TAPOUT_RULES, 1]] as const) {
      const run = start(rules);
      run.state.medicalArc = { key: 'infectedCut', stage: 'treatment', dosesGiven: 0, dosesNeeded: 3, daysInStage: 0 };
      run.call('actPoultice');
      expect(run.state.acts.poultice).toBe(count);
      expect(run.state.medicalArc.dosesGiven).toBe(1);
    }
  });

  it('LEG-008: ice-fishing catches count as ice fishing', () => {
    for (const rules of [V12_RULES, TAPOUT_RULES]) {
      const run = start(rules);
      Object.assign(run.state, { winter: true, loc: 'shore', energy: 999, maxEnergy: 999 });
      const spot = run.state.shoreSpots[0];
      spot.q = 1;
      for (let i = 0; i < 6 && !run.state.tot.net && !run.state.tot.iceFish; i += 1) {
        run.state.hour = 8;
        run.call('iceFishAt', spot.id);
      }
      if (rules === V12_RULES) expect(run.state.tot.net).toBeGreaterThan(0);
      else {
        expect(run.state.tot.iceFish).toBeGreaterThan(0);
        expect(run.state.tot.net).toBe(0);
      }
    }
  });
});

describe('partner rule (§8.3)', () => {
  it('a forced tap-out names what broke you, never who is waiting', () => {
    for (const setup of [{ warmth: 10 }, { hunger: 5 }, { predatorFixation: true }, {}]) {
      const run = start(TAPOUT_RULES);
      Object.assign(run.state, setup);
      run.call('showForcedTapoutCinematic');
      const text = typed.at(-1)!;
      expect(text).not.toMatch(/Mara|partner/);
      expect(text).toContain('You think of');
    }
  });

  it('v12 named the partner in that moment', () => {
    const run = start(V12_RULES);
    run.call('showForcedTapoutCinematic');
    expect(typed.at(-1)).toContain('You think of my partner');
  });
});
