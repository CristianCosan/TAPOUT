// Plays whole TAP / OUT runs and reads everything they showed: the text says "you", uses the
// authored cast, and no tap-out is ever put on the partner (plan §8.3).
import { describe, expect, it } from 'vitest';
import { TAPOUT_RULES } from '@tapout/core';
import { CAST } from '@tapout/content';
import { runSolo } from './lockstep.ts';

// Third-person lines that are about someone else, not the player.
const ALLOWED = [/Let him have it/, /He looks like a Roger/, /seen bolder men/];

describe('TAP / OUT runs, read back', () => {
  const runs = Array.from({ length: 12 }, (_, i) =>
    runSolo({ seed: `you-${i}` }, { days: 40, persona: i % 2 ? 'survivor' : 'random', tapOutChance: 0.02 }, TAPOUT_RULES, CAST),
  );
  const shown = runs.flatMap((run) => [...run.transcript, ...(run.state.log as Array<{ msg: string }>).map((l) => l.msg)]);

  it('plays to an ending', () => {
    expect(runs.every((run) => run.over || run.finalDay > 40)).toBe(true);
  });

  it('always says "you", never "he"', () => {
    const thirdPerson = shown
      .flatMap((text) => text.split(/(?<=[.!?])\s+/))
      .filter((sentence) => /\b(he|his|him|himself)\b/i.test(sentence) && !ALLOWED.some((ok) => ok.test(sentence)));
    expect(thirdPerson).toEqual([]);
  });

  it('uses the authored rivals and prize', () => {
    const text = shown.join('\n');
    expect(text).not.toMatch(/\b(Roland|Callie|Britt)\b/);
    expect(text).not.toContain('$500,000');
  });

  it('never puts a tap-out on Mara', () => {
    for (const run of runs) {
      if (run.state.cause !== 'tap') continue;
      const forced = run.transcript.filter((t) => t.includes('You think of'));
      for (const line of forced) expect(line).not.toMatch(/Mara|partner/);
    }
  });
});
