import { describe, expect, it } from 'vitest';
import { CAST, confessionClips } from '@tapout/content';
import { setPresenter, startRun } from '@tapout/core';

// Every confessional v12 can build must be fully covered by recorded pieces (D-068).
describe('spoken confessionals', () => {
  it('has a recording for every piece of every confessional', () => {
    setPresenter({ showModal: () => undefined, hideModal: () => undefined, typewriterInto: () => undefined });
    const kit = ['axe', 'saw', 'ferro', 'pot', 'knife', 'sleeping', 'tarp', 'line', 'snare', 'bow'];
    let checked = 0;
    const pieces = new Set<string>();
    for (let seed = 0; seed < 300; seed++) {
      const run = startRun({ seed: `confess-${seed}`, kit, backstory: { who: 'partner', fear: 'failing' }, name: 'Dan', heightCm: 178, startWeightKg: 88, sex: 'man', cast: CAST });
      const S = run.state;
      S.day = 1 + (seed % 45);
      S.energy = S.maxEnergy;
      S.hunger = seed % 3 === 0 ? 20 : 60;
      S.warmth = seed % 4 === 0 ? 30 : 60;
      S.morale = [20, 50, 80][seed % 3];
      S.injury = seed % 5 === 0 ? { type: seed % 2 ? 'wrist' : 'ankle', days: 3 } : null;
      S.lastKillDay = seed % 7 === 0 ? S.day : 0;
      S.tot.raids = seed % 2;
      if (seed % 6 === 0) S.home = { stage: 2, pressure: 50, gateNights: 0, breakNights: 0, lastBeatDay: -99, seen: [], closure: 'none', cardShown: false, cardDeclinedDay: 0, cardReturned: false, zeroMoraleDays: 0, medWarnings: 0, hadArc: false, forced: false };
      S.confessedToday = false;
      run.call('actConfess');
      const said = S.confessionals.at(-1)?.text as string | undefined;
      if (!said) continue;
      const covered = confessionClips(said).map((c) => c.text).join(' ');
      expect(covered.replace(/\s+/g, ''), said).toBe(said.replace(/\s+/g, ''));
      for (const c of confessionClips(said)) pieces.add(c.id.replace(/^c-day-\d+$/, 'c-day'));
      checked++;
    }
    expect(checked).toBeGreaterThan(250);
    expect(pieces.has('c-home-1') || pieces.has('c-home-2')).toBe(true);
    expect(pieces.has('c-marten') && pieces.has('c-ankle') && pieces.has('c-fear')).toBe(true);
  });
});
