// Watches the run for moments that deserve music: first frost, first snow, the Big Storm, the
// final two, a kill, an awe moment, a predator, a body stat falling into danger, the ending.
// Reads v12 state only to choose a sound; it never changes anything.

import { useEffect, useRef } from 'react';
import { dawnHour, duskHour } from '@tapout/core';
import type { View } from '../session.ts';
import { audio } from './engine.ts';
import { music, type Sting } from './music.ts';

/** A body stat at or below this is in danger; the heartbeat sounds once as it crosses. */
const DANGER = 20;
const BODY = ['health', 'hunger', 'thirst', 'warmth'] as const;

interface Marks {
  frost: boolean;
  winter: boolean;
  storm: boolean;
  two: boolean;
  kill: unknown;
  awe: number;
  predator: boolean;
  over: boolean;
  danger: boolean;
  day: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function marks(S: any): Marks {
  return {
    frost: !!S.firstFrostHit,
    winter: !!S.winter,
    storm: !!S.bigStormHit,
    two: !!S.finalTwoAnnounced,
    kill: S.killSite?.spawnAbs ?? null,
    awe: Array.isArray(S.aweSeen) ? S.aweSeen.length : 0,
    predator: !!S.predatorPending,
    over: !!S.over,
    danger: BODY.some((k) => typeof S[k] === 'number' && S[k] <= DANGER),
    day: S.day,
  };
}

/** Music and mixing for the game screen. `inside` muffles the outdoors (the night). */
export function useSoundCues(view: View, inside: boolean): void {
  const S = view.state;
  const prev = useRef<Marks | null>(null);

  useEffect(() => {
    const now = marks(S);
    const p = prev.current;
    prev.current = now;
    if (p) {
      let sting: Sting | null = null;
      if (now.over && !p.over) sting = S.cause === 'win' ? 'win' : 'lose';
      else if (now.storm && !p.storm) sting = 'storm';
      else if (now.winter && !p.winter) sting = 'snow';
      else if (now.frost && !p.frost) sting = 'frost';
      else if (now.two && !p.two) sting = 'finalTwo';
      else if (now.kill && now.kill !== p.kill) sting = 'kill';
      else if (now.awe > p.awe) sting = 'awe';
      else if (now.predator && !p.predator) sting = 'fear';
      else if (now.danger && !p.danger) sting = 'danger';
      else if (now.day === 2 && p.day === 1) sting = 'firstNight';
      if (sting) music.sting(sting);
    }
    const h = ((S.hour % 24) + 24) % 24;
    music.setMood({
      storm: S.weather === 'storm',
      night: h < dawnHour() || h > duskHour(),
      winter: !!S.winter,
      cracking: S.resolveState === 'Cracking' || S.resolveState === 'Breaking',
      playing: !S.over,
    });
    // v12 mutates its state in place; the view version marks a change.
  }, [S, view.version]);

  useEffect(() => {
    audio.setDuck(view.modal ? 1 : 0);
  }, [view.modal]);

  useEffect(() => {
    audio.setInside(inside);
  }, [inside]);

  useEffect(
    () => () => {
      audio.setInside(false);
      audio.setDuck(0);
      music.setMood({ storm: false, night: false, winter: false, cracking: false, playing: false });
    },
    [],
  );
}
