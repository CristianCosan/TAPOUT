// Intended-difference tests for M8: each deliberate change to v12, shown against v12 itself.
// The parity tests prove everything else is still identical (they run with V12_RULES).

import { beforeEach, describe, expect, it } from 'vitest';
import { hudRecord, setPresenter, startRun, TAPOUT_RULES, V12_RULES, type RuleSet, type Run } from './game.ts';

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
  it('TAP / OUT: a crash the night before a check ends in a medical pull', () => {
    const run = start(TAPOUT_RULES);
    night(run, { ...crash, day: 13 });
    expect(run.state.cause).toBe('med');
  });
  it('without the medics watching, a crash on any other night is still a death', () => {
    const run = start({ ...TAPOUT_RULES, medicWatch: false });
    night(run, crash);
    expect(run.state.cause).toBe('dead');
  });
  it('rc.6 medicWatch: a crash on any night ends in a medical pull', () => {
    const run = start(TAPOUT_RULES);
    night(run, crash);
    expect(run.state.cause).toBe('med');
  });
  it('rc.7 medicWatch: collapsing during the day ends in a medical pull too', () => {
    for (const [rules, cause] of [[{ ...TAPOUT_RULES, medicWatch: false }, 'dead'], [TAPOUT_RULES, 'med']] as const) {
      const run = start(rules);
      run.state.health = 0;
      run.call('afterAction', 'rest');
      expect(run.state.cause).toBe(cause);
    }
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

describe('autoUnload: walking into camp empties the pack', () => {
  it('adds the haul to camp stock and says what came back; v12 keeps it in the pack', () => {
    for (const rules of [V12_RULES, TAPOUT_RULES]) {
      const run = start(rules);
      const S = run.state;
      S.loc = 'woods';
      S.hour = 9;
      S.carry.wood = 6;
      S.carry.moss = 2;
      const logs = S.stock.wood;
      run.call('goTo', 'camp');
      expect(S.loc).toBe('camp');
      if (rules === TAPOUT_RULES) {
        expect(S.carry.wood).toBe(0);
        expect(S.stock.wood).toBe(logs + 6);
        expect(logText(run)).toContain('You brought back 6 logs and 2 bundles of moss');
      } else {
        expect(S.carry.wood).toBe(6);
        expect(S.stock.wood).toBe(logs);
      }
    }
  });
});

describe('wholeNumbers: max energy is written as a whole number', () => {
  it('rounds the dawn line and the energy readout', () => {
    for (const [rules, expected] of [[V12_RULES, '/161.6166666'], [TAPOUT_RULES, '/162']] as const) {
      start(rules).state.maxEnergy = 161.6166666;
      expect(hudRecord().get('val-energy')?.text).toContain(expected);
    }
  });
});

describe('rc.3 quiet field: you never learn who is left', () => {
  it('v12 tells you when a rival taps out; TAP / OUT does not', () => {
    const said = (rules: Readonly<RuleSet>) => {
      const run = start(rules);
      for (let d = 1; d <= 12; d++) night(run, { day: d, health: 100, hunger: 100, thirst: 100, warmth: 100, morale: 100, energy: 100 });
      expect(run.state.rivals).toBeLessThan(9);
      return (run.state.log as Array<{ msg: string }>).filter((l) => /tapped out|taps out|left in the field/i.test(l.msg)).length;
    };
    expect(said(V12_RULES)).toBeGreaterThan(0);
    expect(said(TAPOUT_RULES)).toBe(0);
  });

  it('the first med check is day 14, then six to eight days later', () => {
    const run = start(TAPOUT_RULES);
    expect(run.call('medDay')).toBe(14);
    night(run, { day: 13, health: 100, hunger: 100, thirst: 100, warmth: 100, morale: 100 });
    const next = run.call<number>('medDay');
    expect(next).toBeGreaterThanOrEqual(20);
    expect(next).toBeLessThanOrEqual(22);
  });

  it('v12 wins the moment the last rival goes; TAP / OUT waits for a med check', () => {
    const v12 = start(V12_RULES);
    night(v12, { day: 9, rivals: 0, health: 100, hunger: 100, thirst: 100, warmth: 100, morale: 100 });
    expect(v12.state.cause).toBe('win');
    const ours = start(TAPOUT_RULES);
    night(ours, { day: 9, rivals: 0, health: 100, hunger: 100, thirst: 100, warmth: 100, morale: 100 });
    expect(ours.state.over).toBeFalsy();
    expect(ours.state.wonPending).toBe(true);
    for (let d = 10; d < 30 && !ours.state.over; d++) night(ours, { day: d, health: 100, hunger: 100, thirst: 100, warmth: 100, morale: 100 });
    expect(ours.state.cause).toBe('win');
    expect(ours.state.winAtMedCheck).toBe(true);
    // The arrival is the app's scene; the cards pick up at the tour of camp.
    expect(modal).toContain('Showing Them');
  });
});

describe('rc.3 soak time: a set trap catches nothing for half a day', () => {
  it('v12 can check a snare the moment it is set; TAP / OUT says too soon', () => {
    for (const rules of [V12_RULES, TAPOUT_RULES]) {
      const run = start(rules);
      Object.assign(run.state, { loc: 'woods', hour: 9, energy: 100, wireStock: 5 });
      run.call('placeSnareAt', (run.state.woodsSpots as Array<{ id: number }>)[0]!.id);
      const snares = run.state.snareList as Array<{ setAbs?: number }>;
      expect(snares.length).toBeGreaterThan(0);
      run.call('checkOneSnare', 0);
      const after = logText(run);
      if (rules === V12_RULES) expect(after).not.toContain('Too soon');
      else expect(after).toContain('Too soon');
    }
  });
});

describe('rc.3 camp harvest: logs and rocks at camp', () => {
  it('only TAP / OUT offers them at camp, straight into the stock', () => {
    const v12 = start(V12_RULES);
    const ours = start(TAPOUT_RULES);
    for (const run of [v12, ours]) Object.assign(run.state, { loc: 'camp', hour: 9, energy: 100 });
    const shown = (run: Run) => run.call<Array<{ id: string; visible: boolean }>>('actionPanel').filter((b) => b.visible).map((b) => b.id);
    expect(shown(v12)).not.toContain('a-rocks');
    expect(shown(ours)).toContain('a-rocks');
    expect(shown(ours)).toContain('a-wood');
    const rocks = ours.state.stock.rocks as number;
    ours.call('actRocks');
    expect(ours.state.stock.rocks).toBe(rocks + 3);
    expect(ours.state.carry.rocks).toBe(0);
  });
});

describe('rc.3 dugout stages: dig, then walls and roof', () => {
  it('v12 spends logs on every dig; TAP / OUT digs first and spends logs and moss on walls and roof', () => {
    const kit = ['shovel', 'saw', 'ferro', 'pot', 'knife', 'sleeping', 'tarp', 'line', 'snare', 'bow'];
    for (const rules of [V12_RULES, TAPOUT_RULES]) {
      const run = start(rules, kit);
      Object.assign(run.state, { loc: 'camp', hour: 8, energy: 120, maxEnergy: 120 });
      run.state.stock.wood = 20; run.state.stock.moss = 10;
      run.call('actDugout');
      expect(run.state.dugoutProg).toBe(1);
      expect(run.state.stock.wood).toBe(rules === V12_RULES ? 18 : 20);
      Object.assign(run.state, { hour: 8, energy: 120, day: run.state.day + 1 }); run.call('actDugout');
      // rc.4 (stepBuilds): the pit is three steps in TAP / OUT, so the walls are the fourth.
      if (rules === TAPOUT_RULES) { Object.assign(run.state, { hour: 8, energy: 120, day: run.state.day + 1 }); run.call('actDugout'); }
      expect(run.state.stock.wood).toBe(rules === V12_RULES ? 16 : 20);
      Object.assign(run.state, { hour: 8, energy: 120, day: run.state.day + 1 }); run.call('actDugout');
      expect(run.state.stock.wood).toBe(rules === V12_RULES ? 14 : 16);
      expect(run.state.stock.moss).toBe(rules === V12_RULES ? 10 : 8);
    }
  });
});

describe('rc.4 step builds', () => {
  it('v12 raises the tripod rack in one session; TAP / OUT in three steps for the same 4 logs', () => {
    for (const rules of [V12_RULES, TAPOUT_RULES]) {
      const run = start(rules);
      Object.assign(run.state, { loc: 'camp', hour: 8, energy: 120, maxEnergy: 120 });
      run.state.stock.wood = 20;
      run.call('actRack');
      expect(run.state.rackTier).toBe(rules === V12_RULES ? 1 : 0);
      if (rules === TAPOUT_RULES) {
        Object.assign(run.state, { energy: 120 }); run.call('actRack');
        Object.assign(run.state, { energy: 120 }); run.call('actRack');
        expect(run.state.rackTier).toBe(1);
      }
      expect(run.state.stock.wood).toBe(16);
    }
  });
});

describe('rc.3 test mode (Settings)', () => {
  it('tops energy back up after each action only while it is on', () => {
    const run = start(TAPOUT_RULES);
    Object.assign(run.state, { loc: 'camp', hour: 9 });
    run.call('actFirewood');
    expect(run.state.energy).toBeLessThan(run.state.maxEnergy);
    run.call('testSetInfinite', true);
    run.call('actFirewood');
    expect(run.state.energy).toBe(run.state.maxEnergy);
  });
});

describe('rc.4 one route and build pace', () => {
  const kit = ['shovel', 'saw', 'ferro', 'pot', 'knife', 'sleeping', 'tarp', 'line', 'snare', 'bow'];
  it('starting the dugout closes the shelter route only in TAP / OUT', () => {
    for (const rules of [V12_RULES, TAPOUT_RULES]) {
      const run = start(rules, kit);
      Object.assign(run.state, { loc: 'camp', hour: 8, energy: 120, maxEnergy: 120 });
      run.state.stock.wood = 30; run.state.stock.moss = 10;
      run.call('actDugout');
      Object.assign(run.state, { hour: 8, energy: 120 });
      run.call('actShelter');
      expect(run.state.buildProg).toBe(rules === V12_RULES ? 1 : 0);
    }
  });
  it('past the lean-to, one session a day only in TAP / OUT', () => {
    for (const rules of [V12_RULES, TAPOUT_RULES]) {
      const run = start(rules);
      Object.assign(run.state, { loc: 'camp', hour: 8, energy: 120, maxEnergy: 120, structure: 1, buildProg: 0 });
      run.state.stock.wood = 40; run.state.stock.moss = 10; run.state.stock.clay = 10;
      run.call('actShelter');
      Object.assign(run.state, { hour: 8, energy: 120 });
      run.call('actShelter');
      expect(run.state.buildProg).toBe(rules === V12_RULES ? 2 : 1);
    }
  });
});

describe('rc.4 real times', () => {
  it('foraging takes 15 minutes in v12, 30 with rc.4 times and 20 with Sir\'s rc.8 times, for the same energy', () => {
    for (const [rules, h] of [[V12_RULES, 0.25], [{ ...TAPOUT_RULES, sirTimes: false }, 0.5], [TAPOUT_RULES, 1 / 3]] as const) {
      const run = start(rules);
      Object.assign(run.state, { loc: 'woods', hour: 9, energy: 120, maxEnergy: 120 });
      run.call('actForage');
      expect(run.state.hour - 9).toBeCloseTo(h, 5);
    }
  });
  it('lighting a fire with the ferro rod is free of time in v12 and takes 1 to 30 minutes in TAP / OUT', () => {
    for (const rules of [V12_RULES, TAPOUT_RULES]) {
      const run = start(rules);
      Object.assign(run.state, { loc: 'camp', hour: 9, fireH: 0, tinder: 3, weather: 'clear' });
      run.state.stock.firewood = 5;
      run.call('actFire');
      const took = run.state.hour - 9;
      if (rules === V12_RULES) expect(took).toBe(0);
      else { expect(took).toBeGreaterThanOrEqual(1 / 60 - 1e-9); expect(took).toBeLessThanOrEqual(0.5 + 1e-9); }
    }
  });
});

describe('rc.5 clothing', () => {
  it('changing takes a minute in TAP / OUT and does nothing in v12', () => {
    for (const rules of [V12_RULES, TAPOUT_RULES]) {
      const run = start(rules);
      Object.assign(run.state, { loc: 'camp', hour: 9 });
      run.call('wear', 'shell');
      expect(run.call('wearing', 'shell')).toBe(rules !== V12_RULES);
      expect(run.state.hour - 9).toBeCloseTo(rules === V12_RULES ? 0 : 1 / 60, 5);
    }
  });
  it('the shell keeps rain out and the jacket keeps warmth in, away from camp', () => {
    const away = (rules: Readonly<RuleSet>, shell: boolean, jacket: boolean) => {
      const run = start(rules);
      Object.assign(run.state, { loc: 'woods', hour: 9, weather: 'rain', wet: 0, warmth: 80, hoursOutsideStreak: 0, clothes: { jacket, shell } });
      run.call('tickHours', 2, true, '');
      return { wet: run.state.wet as number, warmth: run.state.warmth as number };
    };
    const bare = away(TAPOUT_RULES, false, false);
    expect(away(TAPOUT_RULES, true, false).wet).toBeLessThan(bare.wet);
    expect(away(TAPOUT_RULES, false, true).warmth).toBeGreaterThan(bare.warmth);
    expect(away(V12_RULES, true, true)).toEqual(away(V12_RULES, false, false));
  });
  it('heavy work in the jacket makes you sweat', () => {
    const work = (jacket: boolean) => {
      const run = start(TAPOUT_RULES);
      Object.assign(run.state, { loc: 'camp', hour: 9, weather: 'clear', wet: 20, fireH: 0, clothes: { jacket, shell: false } });
      run.call('tickHours', 2, false, 'w');
      return run.state.wet as number;
    };
    expect(work(true)).toBeGreaterThan(work(false));
  });
});

describe('rc.5 stove', () => {
  it('is only built in TAPOUT, once the hut is framed', () => {
    for (const rules of [V12_RULES, TAPOUT_RULES]) {
      const run = start(rules);
      Object.assign(run.state, { loc: 'camp', hour: 9, energy: 120, maxEnergy: 120, structure: 1 });
      Object.assign(run.state.stock, { rocks: 20, clay: 10 });
      run.call('actStove');
      expect(!!run.state.stove).toBe(false);
      run.state.structure = 2;
      run.call('actStove');
      expect(!!run.state.stove).toBe(rules !== V12_RULES);
    }
  });
  it('keeps a banked fire going longer through the night', () => {
    const night = (stove: boolean) => {
      const run = start(TAPOUT_RULES);
      Object.assign(run.state, { loc: 'camp', hour: 21, fireH: 6, structure: 2, stove });
      run.state.stock.firewood = 0;
      run.call('actSleep');
      return run.state.warmth as number;
    };
    expect(night(true)).toBeGreaterThan(night(false));
  });
});

describe('rc.6 second tarp in every stage', () => {
  it('helps more the bigger the shelter, only in TAP / OUT', () => {
    const ins = (rules: Readonly<RuleSet>, structure: number) => {
      const run = start(rules, ['axe', 'saw', 'ferro', 'pot', 'bag', 'tarp']);
      Object.assign(run.state, { structure, wet: 0, fireH: 0, day: 10 });
      return run.call<number>('effectiveInsulation', true);
    };
    expect(ins(V12_RULES, 2) - ins(V12_RULES, 0)).toBeCloseTo(2.6, 5);
    expect(ins(TAPOUT_RULES, 2) - ins(TAPOUT_RULES, 0)).toBeCloseTo(2.6 + 0.7, 5);
  });
});

describe('rc.6 late upgrades', () => {
  it('an idea comes after day 20 in TAP / OUT only, and the reflector warms the fire', () => {
    for (const rules of [V12_RULES, TAPOUT_RULES]) {
      const run = start(rules);
      run.state.day = 22;
      for (let i = 0; i < 40; i++) run.call('lateTick', []);
      expect(run.call('lateKnown', 'reflector')).toBe(rules !== V12_RULES);
    }
    const run = start(TAPOUT_RULES);
    Object.assign(run.state, { loc: 'camp', hour: 9, day: 22, fireH: 4, lateKnown: ['reflector'] });
    Object.assign(run.state.stock, { wood: 10, rocks: 10 });
    const before = run.call<number>('effectiveInsulation', true);
    run.call('actReflector');
    expect(run.call<number>('effectiveInsulation', true) - before).toBeCloseTo(0.8, 5);
  });
});

describe('rc.6 more choices', () => {
  it('ten more cards, offered only in TAP / OUT', () => {
    expect(startRun && start(TAPOUT_RULES).call('moreCardCount')).toBe(10);
    for (const rules of [V12_RULES, TAPOUT_RULES]) {
      const run = start(rules);
      Object.assign(run.state, { loc: 'camp', day: 8, weather: 'clear', morale: 40, stress: 60 });
      const offered = Object.values(run.call<Record<string, { trigger: () => boolean; id: string }>>('moreCardDeck')).filter((c) => c.trigger());
      expect(offered.length > 0).toBe(rules !== V12_RULES);
    }
  });
});

describe('rc.6 winter ice and wet rocks', () => {
  it('thin ice is slow and can give in TAP / OUT; v12 never', () => {
    let fell = 0;
    for (let i = 0; i < 40; i++) {
      const run = start(TAPOUT_RULES, undefined, `ice${i}`);
      Object.assign(run.state, { loc: 'shore', hour: 9, winter: true, iceFrom: run.state.day, energy: 120, maxEnergy: 120, warmth: 80 });
      run.call('iceFishAt', run.state.shoreSpots[0].id);
      if (run.state.fell) fell++;
      if (!run.state.fell) expect(run.state.hour - 9).toBeCloseTo(3, 5);
    }
    expect(fell).toBeGreaterThan(3);
    expect(fell).toBeLessThan(20);
    const v12 = start(V12_RULES);
    Object.assign(v12.state, { loc: 'shore', hour: 9, winter: true, energy: 120, maxEnergy: 120 });
    v12.call('iceFishAt', v12.state.shoreSpots[0].id);
    expect(v12.state.hour - 9).toBeCloseTo(2, 5);
    expect(v12.state.fell).toBeUndefined();
  });
  it('the ice thickens day by day', () => {
    const run = start(TAPOUT_RULES);
    Object.assign(run.state, { winter: true, iceFrom: 10, day: 10 });
    expect(run.call('thinIce')).toBe(true);
    run.state.day = 14;
    expect(run.call('thinIce')).toBe(false);
  });
  it('storm-day shore jobs put you in off the rocks now and then', () => {
    let fell = 0;
    for (let i = 0; i < 60; i++) {
      const run = start(TAPOUT_RULES, undefined, `rock${i}`);
      Object.assign(run.state, { loc: 'shore', hour: 9, weather: 'storm', energy: 120, maxEnergy: 120 });
      run.state.carry.rocks = 0;
      run.call('actRocks');
      if (run.state.fell) fell++;
    }
    expect(fell).toBeGreaterThan(6);
    expect(fell).toBeLessThan(30);
  });
});
