// Chooses when Dan thinks out loud (D-067, D-068). A thought is due every four to five game days,
// every two to three while he is low, and then waits for a quiet moment (or for him to look at
// something worth a line). Moments (first frost, a rival gone, the first fish) speak between, but
// not within a day of the last thing he said. What he says to the camera is always spoken. Each
// line is heard once per run. Reads v12 state only to choose a line; nothing here changes the run,
// and no line is advice.

import { useEffect, useRef } from 'react';
import { confessionClips, THOUGHTS, THOUGHT_TIMING as T, type Thought, type ThoughtWhen } from '@tapout/content';
import { dawnHour, duskHour } from '@tapout/core';
import { session, type View } from '../session.ts';
import { noticeLook, onLook, speak, speaking, speakPieces, stopThought } from './thoughts.ts';

/** Moments that only ever get one thought per run, however often they happen. */
const ONCE = new Set<ThoughtWhen>(['arriveShore', 'arriveWoods', 'firstNight', 'firstFire', 'firstFish', 'firstSnare', 'firstKill', 'wavering']);

interface Marks {
  loc: string;
  day: number;
  frost: boolean;
  winter: boolean;
  storm: boolean;
  two: boolean;
  rivals: number;
  fires: number;
  fish: number;
  snared: number;
  kills: number;
  predator: boolean;
  wavering: boolean;
  confessions: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function marks(S: any): Marks {
  const tot = S.tot ?? {};
  return {
    loc: S.loc,
    day: S.day,
    frost: !!S.firstFrostHit,
    winter: !!S.winter,
    storm: !!S.bigStormHit,
    two: !!S.finalTwoAnnounced,
    rivals: S.rivals ?? 0,
    fires: tot.fires ?? 0,
    fish: (tot.lines ?? 0) + (tot.net ?? 0),
    snared: tot.snared ?? 0,
    kills: tot.animalsKilled ?? 0,
    predator: !!S.predatorPending,
    wavering: !!S.resolveState && S.resolveState !== 'Steady',
    confessions: S.confessionals?.length ?? 0,
  };
}

function moments(p: Marks, n: Marks): ThoughtWhen[] {
  const out: ThoughtWhen[] = [];
  if (n.loc === 'shore' && p.loc !== 'shore') out.push('arriveShore');
  if (n.loc === 'woods' && p.loc !== 'woods') out.push('arriveWoods');
  if (n.day === 2 && p.day === 1) out.push('firstNight');
  if (n.frost && !p.frost) out.push('frost');
  if (n.winter && !p.winter) out.push('snow');
  if (n.storm && !p.storm) out.push('storm');
  if (n.two && !p.two) out.push('finalTwo');
  else if (n.rivals < p.rivals) out.push('rivalGone');
  if (n.fires > 0 && p.fires === 0) out.push('firstFire');
  if (n.fish > 0 && p.fish === 0) out.push('firstFish');
  if (n.snared > 0 && p.snared === 0) out.push('firstSnare');
  if (n.kills > 0 && p.kills === 0) out.push('firstKill');
  if (n.predator && !p.predator) out.push('predator');
  if (n.wavering && !p.wavering) out.push('wavering');
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fits(t: Thought, S: any): boolean {
  const h = ((S.hour % 24) + 24) % 24;
  const night = h < dawnHour() || h > duskHour();
  if (t.area && t.area !== S.loc) return false;
  if (t.night !== undefined && t.night !== night) return false;
  if (t.winter !== undefined && t.winter !== !!S.winter) return false;
  if (t.fromDay && S.day < t.fromDay) return false;
  if (t.weather && !t.weather.includes(S.weather)) return false;
  if (t.morning && !(h >= dawnHour() && h < dawnHour() + 3)) return false;
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function body(S: any): ThoughtWhen[] {
  const out: ThoughtWhen[] = [];
  if (S.warmth <= T.low) out.push('cold');
  if (S.hunger <= T.low) out.push('hungry');
  if (S.thirst <= T.low) out.push('thirsty');
  if (S.energy < S.maxEnergy * T.tired) out.push('tired');
  if (S.wet >= T.wet) out.push('wet');
  return out;
}

/** Game hours since the run began. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hours(S: any): number {
  return (S.day - 1) * 24 + S.hour;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isLow(S: any): boolean {
  return S.morale <= T.lowMorale || (!!S.resolveState && S.resolveState !== 'Steady') || body(S).length > 0;
}

/** Whether a thought is due: four to five days since the last, two to three while he is low. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function due(S: any): boolean {
  const [at, roll] = session.lastThought();
  const [from, to] = isLow(S) ? T.lowStretch : T.steady;
  return hours(S) - at >= from + (to - from) * roll;
}

function pick<X>(xs: readonly X[]): X | undefined {
  return xs[Math.floor(Math.random() * xs.length)];
}

/** Dan's inner voice for the game screen. `quiet` is false while a card, the night or the end is up. */
export function useThoughts(view: View, quiet: boolean): void {
  const S = view.state;
  const live = useRef({ S, quiet });
  live.current = { S, quiet };
  const clock = useRef({ start: performance.now(), lastAny: -Infinity, dueSince: null as number | null, held: [] as Array<{ when: ThoughtWhen; at: number }> });
  const prev = useRef<Marks | null>(null);

  const now = () => (performance.now() - clock.current.start) / 1000;

  /** Says one unheard line for `when` (fitting the moment), if any. */
  const say = (when: ThoughtWhen): boolean => {
    const heard = session.heardThoughts();
    if (ONCE.has(when) && THOUGHTS.some((t) => t.when === when && heard.includes(t.id))) return false;
    const line = pick(THOUGHTS.filter((t) => t.when === when && !heard.includes(t.id) && fits(t, live.current.S)));
    if (!line || !speak(line.id, line.say)) return false;
    session.markThought(line.id, hours(live.current.S));
    clock.current.lastAny = now();
    clock.current.dueSince = null;
    return true;
  };

  const ready = (): boolean =>
    live.current.quiet && !live.current.S.over && !document.hidden && !speaking() && now() - clock.current.lastAny >= T.minGap;

  // Moments and confessionals, as v12 state changes.
  useEffect(() => {
    const n = marks(S);
    const p = prev.current;
    prev.current = n;
    if (!p || S.over) return;
    if (n.confessions > p.confessions) {
      const text = S.confessionals.at(-1)?.text ?? '';
      if (speakPieces(confessionClips(text).map((c) => c.id), text, T.confessGap)) clock.current.lastAny = now();
    }
    for (const when of moments(p, n)) clock.current.held.push({ when, at: now() });
    // v12 mutates its state in place; the view version marks a change.
  }, [S, view.version]);

  // Every two seconds: a held moment, or a due thought.
  useEffect(() => {
    const tick = window.setInterval(() => {
      const c = clock.current;
      const S = live.current.S;
      c.held = c.held.filter((m) => now() - m.at < 90);
      if (!ready()) return;
      if (c.held.length) {
        const m = c.held.shift()!;
        if (hours(S) - session.lastThought()[0] >= T.momentGap) say(m.when);
        return;
      }
      if (!due(S)) {
        c.dueSince = null;
        return;
      }
      c.dueSince ??= now();
      // Give him a little while to look at something worth a line first.
      if (now() - c.dueSince < T.lookWait) return;
      const pools: ThoughtWhen[] = isLow(S) ? ['low', ...body(S).sort(() => Math.random() - 0.5), 'quiet'] : [...(Math.random() < 0.5 ? body(S) : []), 'quiet'];
      for (const when of pools) if (say(when)) return;
    }, 2000);
    return () => window.clearInterval(tick);
  }, []);

  // Looking at something, when a thought is due.
  useEffect(
    () =>
      onLook((id) => {
        if (id && ready() && due(live.current.S)) say(`look:${id}`);
      }),
    [],
  );

  // Leaving the game screen ends a thought mid-sentence.
  useEffect(
    () => () => {
      stopThought();
      noticeLook(null);
    },
    [],
  );
}
