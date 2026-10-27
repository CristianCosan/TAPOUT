// rc.6 (thinIce, wetRocks; Sir's winter asks). Not in v12. The lake ice thickens day by day after
// winter comes; you can check it, and on thin ice the ice jobs go slowly and you can go through.
// On storm days the shore rocks are slick and you can go in off them. Falling in soaks you; out on
// the ice it can end the run if you are already frozen, otherwise you stumble back to camp.

import { rand } from './runtime.ts';
import { endGame } from './endings.ts';
import { clamp, pick } from './helpers.ts';
import { pushModifier } from './modifiers.ts';
import { log } from './setup.ts';
import { RULES } from './rules.ts';
import { S } from './state.ts';
import { afterAction, spend } from './threads.ts';
import { ICE } from './tuning.ts';

/** How thick the lake ice is today, in centimetres. */
export function iceCm(){
  const from = S.iceFrom ?? S.zeroCrossDay;
  return Math.round(clamp(ICE.startCm + (S.day - from) * ICE.cmPerDay, 0, ICE.maxCm));
}
export function thinIce(){ return RULES.thinIce && !!S.winter && iceCm() < ICE.safeCm; }
/** Ice jobs take this much longer while the ice is thin (1 in v12). */
export function iceSlow(){ return thinIce() ? ICE.slowMul : 1; }

export function actCheckIce(){
  if (!RULES.thinIce || !S.winter || S.loc !== 'shore') return;
  if (!spend(1, ICE.checkHours, true, 'o')) return;
  const cm = iceCm();
  S.iceCheckedDay = S.day;
  log(cm < ICE.safeCm
    ? pick([`You chop a test hole a step out. ${cm} centimetres, grey and wet at the edge. Not enough. Not nearly.`, `The axe goes through in three blows. ${cm} centimetres. It creaks when you lean on it.`, `${cm} centimetres, and you can hear water moving under it. You back off slowly.`])
    : pick([`You chop a test hole. ${cm} centimetres of clear black ice. It will hold you.`, `${cm} centimetres. The axe rings off it. Solid.`, `A good ${cm} centimetres. You stamp on it and it does not even answer.`]), cm < ICE.safeCm ? 'bad' : 'good');
  afterAction('checkIce');
}

function fallIn(kind: 'ice' | 'rocks'){
  S.fell = { kind, day: S.day, n: (S.fell?.n ?? 0) + 1 };
  const f = ICE.fall[kind];
  S.wet = clamp(Math.max(S.wet, f.wet));
  S.warmth = clamp(S.warmth - f.warmth);
  S.health = clamp(S.health - f.health);
  S.stress = clamp(S.stress + f.stress);
  if (kind === 'ice' && !S.soakedThrough){
    S.soakedThrough = true; S.dryHoursAccum = 0;
    if (S.conditions.soakedThrough) S.conditions.soakedThrough.active = true;
    pushModifier('soakedThrough', '💧 Soaked Through', 'Through the ice. Nothing gets warm again until your gear dries by a fire.', 'neg');
  }
  if (kind === 'rocks'){
    log(pick(['Your boot goes out from under you on the wet rock and you are in the lake to the waist, gasping.', 'A slick stone rolls and you go in sideways. The cold takes your breath clean away.', 'The rock is like glass in this rain. You go in up to your chest before you can stop.']), 'bad');
    return;
  }
  if (S.warmth <= ICE.rescueWarmth){
    log('🩺 The ice gives with a sound like a gunshot. You get yourself out, somehow, but your hands will not work and you cannot stop shaking. Somebody was watching the feed: the boat is there inside the hour. This is the end of the run.', 'bad');
    endGame('med');
    return;
  }
  log('The ice gives with a sound like a gunshot and the lake closes over your legs. You claw back onto the shelf and stumble for camp, clothes already stiffening.', 'bad');
  S.loc = 'camp';
}

/** Called after an ice job is paid for: on thin ice, sometimes you go through. */
export function iceGamble(): boolean {
  if (!thinIce() || rand() >= ICE.fallChance) return false;
  fallIn('ice');
  return true;
}
/** Called after a shore job on a storm day: sometimes you go in off the rocks. */
export function rockGamble(){
  if (!RULES.wetRocks || S.over || S.loc !== 'shore' || S.winter || S.weather !== 'storm') return;
  if (rand() < ICE.rockChance) fallIn('rocks');
}
