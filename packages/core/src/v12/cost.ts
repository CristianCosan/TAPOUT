// Ported from legacy/tap-out-v12.html (lines 1905-1979). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { clamp } from './helpers.ts';
import { hasTrait } from './interior.ts';
import { hasKit, tempFor } from './setup.ts';
import { S } from './state.ts';
import { TUNING } from './tuning.ts';
// ============================== time, cost & injury engine ==============================
// v12 §6.1: ankle-specific multiplier table replaces the old blanket 1.5x - travel/wood are hammered
// (x3.5), most physical work is heavily taxed (x3.0), cooking/boiling stay near-normal (x1.1).
export function ankleMul(tags?){
  if (!S.injury || S.injury.type !== 'ankle') return 1;
  const A = TUNING.ankle;
  if (tags.includes('cook')) return A.cookBoilMul;
  if (tags.includes('t')) return A.travelMul;
  if (tags.includes('wood')) return A.woodMul;
  if (tags.includes('o') || tags.includes('w')) return A.physicalMul;
  return 1;
}
// v12 §4.1: Shivering - any cold/wet tag active multiplies time 1.5x and energy 2x, stacking
// multiplicatively with the ankle table above.
export function shiveringActive(){
  return !!(S.soakedThrough || (S.conditions.aCold && S.conditions.aCold.active) || S.wet > 70);
}
export function eCost(base?, tags=''){
  let v = base;
  if (hasTrait('handy') && tags.includes('h')) v = Math.round(v*0.9);
  if (S.winter) v = Math.round(v * TUNING.postSnow.actionEnergyMultiplier);
  v = Math.round(v * ankleMul(tags));
  if (S.injury && S.injury.type === 'wrist' && tags.includes('h')) v = Math.round(v*1.5);
  if (shiveringActive() && (tags.includes('o')||tags.includes('w')||tags.includes('h'))) v = Math.round(v * TUNING.shivering.energyMul);
  return v;
}
export function eTime(base?, tags=''){
  let v = base;
  if (hasTrait('handy') && tags.includes('h')) v *= 0.9;
  if (hasTrait('restless') && tags.includes('t')) v *= 0.9;
  v *= ankleMul(tags);
  if (S.injury && S.injury.type === 'wrist' && tags.includes('h')) v *= 1.5;
  if (shiveringActive() && (tags.includes('o')||tags.includes('w')||tags.includes('h'))) v *= TUNING.shivering.timeMul;
  return v;
}
export function phaseOf(){ if (S.winter) return 'P3'; if (S.firstFrostHit) return 'P2'; return 'P1'; }
export function ambientTempC(forceNight?){
  const night = forceNight !== undefined ? forceNight : (S.hour>=21 || S.hour<6);
  let t2 = tempFor(S.day) + (night ? -5 : 4);
  if (S.weather==='storm') t2 -= 8;
  else if (S.weather==='clear') t2 -= 4;
  else if (S.weather==='rain') t2 += 3;
  return Math.round(t2);
}
export function effectiveInsulation(indoors?, fireActive?){
  let ins = 1 + S.structure*1.3 + S.insulation*1.0 + (S.dugout ? 2.2 : 0);
  if (indoors && S.bed) ins += 0.6;
  if (indoors && !hasKit('bag')) ins -= 1.2; // kit-draft: no sleeping bag is a real handicap until moss bed + shelter T2
  if (fireActive === undefined) fireActive = (S.fireH > 0 && S.loc==='camp');
  if (fireActive) ins += 3;
  if (hasKit('tarp')) ins += 0.8;
  ins *= (1 - Math.min(0.6, S.wet/150));
  if (S.day <= 5) ins += TUNING.temperature.arrivalFitnessBuffer / 10;
  return ins;
}
export function warmthDrainRate(outdoor?, forceNight?){
  const t = ambientTempC(forceNight);
  const feelsLike = t - (outdoor ? 3 : 0) - (S.weather==='storm' || S.weather==='rain' ? 3 : 0);
  const ins = effectiveInsulation(!outdoor);
  const deficit = Math.max(0, 17 - feelsLike);
  let rate = Math.max(0.4, deficit*0.5 - ins*1.0);
  if (S.wet > 50) rate *= 2;
  return rate;
}
export function kcalBurnRate(tags?){
  let rate = 150;
  if (tags.includes('t')) rate = 250;
  else if (tags.includes('w')) rate = 400;
  if (S.winter) rate *= 1.15;
  if (S.warmth < 40) rate += 60;
  return rate;
}
export function weightLossPct(){ return S.startWeight ? Math.max(0, (S.startWeight - S.weight) / S.startWeight) : 0; }
export function healthCeiling(){
  const kgLost = Math.max(0, S.startWeight - S.weight);
  const isolationToll = Math.max(0, S.day - 10) * 1.0; // compression: isolation toll onset/rate halved-and-doubled to land the same total by run's end
  return clamp(100 - kgLost*1.0 - isolationToll, 30, 100);
}

