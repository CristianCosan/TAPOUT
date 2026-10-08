import { describe, expect, it } from 'vitest';
import { P1, RIVALS } from './index.ts';

describe('content', () => {
  it('keeps the protagonist on the body v12 was balanced for', () => {
    expect(P1.heightCm).toBe(178);
    expect(P1.startWeightKg).toBe(88);
  });

  it('has nine rivals, none using a v12 name', () => {
    expect(RIVALS).toHaveLength(9);
    for (const rival of RIVALS) expect(rival.name).not.toBe(rival.v12);
  });
});
