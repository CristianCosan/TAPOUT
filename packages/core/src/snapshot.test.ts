import { describe, expect, it } from 'vitest';
import { restoreRun, snapshotRun, startRun } from './game.ts';

const options = {
  seed: 'snap',
  kit: ['axe', 'saw', 'pot', 'bag', 'ferro', 'bow', 'line', 'wire', 'mace', 'multitool'],
  backstory: { who: 'partner', fear: 'failing' },
  name: 'Dan',
  heightCm: 178,
  startWeightKg: 88,
  sex: 'man' as const,
};

function play(run: ReturnType<typeof startRun>, calls: string[]) {
  for (const fn of calls) run.call(fn);
}

describe('run snapshots', () => {
  it('resumes a run so it continues exactly as if it had never stopped', () => {
    const script = ['actFirewood', 'actTinder', 'actFire', 'actRest', 'actRest', 'actRest', 'actRest', 'actRest', 'actRest', 'actRest', 'actRest', 'actRest', 'actRest', 'actSleep', 'actFirewood', 'actRest'];
    const straight = startRun(options);
    play(straight, script);
    const expected = snapshotRun(straight);

    const first = startRun(options);
    play(first, script.slice(0, 8));
    const saved = JSON.parse(JSON.stringify(snapshotRun(first)));
    startRun({ ...options, seed: 'something else entirely' });
    const resumed = restoreRun(saved);
    play(resumed, script.slice(8));
    expect(snapshotRun(resumed)).toEqual(expected);
    expect(resumed.state.kit).toBeInstanceOf(Set);
  });
});
