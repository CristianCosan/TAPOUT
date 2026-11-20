// Intended difference (bug fix, 2026-11-20): v12's "The Last Look" card put "Betty's snag" into its onclick
// unescaped, so that button was a syntax error and the end of the run stuck on the card. Every button
// on the loss cards must now be valid script.
import { describe, expect, it } from 'vitest';
import { setPresenter, startRun, TAPOUT_RULES } from './game.ts';
import { showLossStep3, showLossStep4 } from './v12/endingSequences.ts';

let modal: string | null = null;
setPresenter({ showModal: (h: string) => { modal = h; }, hideModal: () => { modal = null; }, typewriterInto: () => {} });
const kit = ['axe', 'saw', 'pot', 'bag', 'ferro', 'bow', 'line', 'wire', 'mace', 'multitool'];

describe('loss cards', () => {
  it('every Why and Last Look button is valid script, Betty\'s snag included', () => {
    startRun({ seed: 'look', kit, backstory: { who: 'partner', fear: 'failing' }, name: 'Dan', heightCm: 178, startWeightKg: 88, sex: 'man', rules: TAPOUT_RULES });
    for (const show of [showLossStep3, showLossStep4]) {
      show('med');
      const handlers = [...(modal ?? '').matchAll(/onclick="([^"]+)"/g)].map((m) => m[1]);
      expect(handlers.length).toBeGreaterThan(3);
      for (const h of handlers) expect(() => new Function(h)).not.toThrow();
    }
    expect(modal).toContain("recordLastLook('Betty\\'s snag')");
  });
});
