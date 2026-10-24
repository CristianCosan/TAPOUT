import { describe, expect, it } from 'vitest';
import { INTRO_DROPOFF, INTRO_KITCHEN } from './intro.ts';

describe('the intro', () => {
  const all = [
    ...INTRO_KITCHEN.opening,
    INTRO_KITCHEN.task,
    ...Object.values(INTRO_KITCHEN.notes).flatMap((n) => [n.title, n.text]),
    ...INTRO_DROPOFF.lines.map((l) => l.text),
  ];

  it('speaks to you, never about him (D-003)', () => {
    // "his" may still belong to your father; "he" and "himself" never describe you.
    for (const text of all) expect(text, text).not.toMatch(/\b(he|himself|Daniel does|Dan is)\b/i);
  });

  it('explains the game before it starts: the phone, the medics, the camera, the prize', () => {
    const briefing = INTRO_DROPOFF.lines.map((l) => l.text).join(' ');
    for (const word of ['phone', 'Medics', 'camera', '$400,000']) expect(briefing).toContain(word);
  });
});
