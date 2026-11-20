// Intended difference (bug fix, 2026-11-20): with the ready-made gill net in the kit, the net counts as built
// from day one but sits in the pack with no spot. v12 still put the net on the "Lines & net" card, and its
// Check button threw (no spot to read) after taking the energy and time. Under TAPOUT_RULES (netSpot) the net
// shows on that card only once it is set at a spot, and checkNet does nothing until then. v12 is unchanged.
import { describe, expect, it } from 'vitest';
import { setPresenter, startRun, TAPOUT_RULES, V12_RULES } from './game.ts';

let modal: string | null = null;
setPresenter({ showModal: (h: string) => { modal = h; }, hideModal: () => { modal = null; }, typewriterInto: () => {} });
const kit = ['axe', 'saw', 'pot', 'bag', 'ferro', 'bow', 'line', 'wire', 'mace', 'net'];
const opts = { kit, backstory: { who: 'partner', fear: 'failing' }, name: 'Dan', heightCm: 178, startWeightKg: 88, sex: 'man' } as const;

describe('ready-made net not yet set', () => {
  it('is left off the check card and Check does nothing under TAPOUT_RULES', () => {
    const run = startRun({ ...opts, seed: 'net', rules: TAPOUT_RULES });
    const S = run.state;
    expect(S.net.built).toBe(true);
    expect(S.net.spot).toBe(null);
    S.loc = 'shore';
    const spot = S.shoreSpots[0].id;
    run.call('placeLineAt', spot);
    expect(S.lineList.length).toBe(1);
    modal = null;
    run.call('openCheckShoreModal');
    expect(modal).toContain('Lines &amp; net');
    expect(modal).not.toContain('checkNet()');
    const before = { e: S.energy, h: S.hour };
    expect(() => run.call('checkNet')).not.toThrow();
    expect({ e: S.energy, h: S.hour }).toEqual(before);
  });
  it('still shows the net on the card in v12 mode', () => {
    const run = startRun({ ...opts, seed: 'net', rules: V12_RULES });
    run.state.loc = 'shore';
    modal = null;
    run.call('openCheckShoreModal');
    expect(modal).toContain('checkNet()');
  });
});
