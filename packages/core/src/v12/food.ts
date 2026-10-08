// Ported from legacy/tap-out-v12.html (lines 1474-1503). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { markSetback } from './director.ts';
import { clamp, nowAbs } from './helpers.ts';
import { sensitivityMul } from './setup.ts';
import { S } from './state.ts';
import { TUNING } from './tuning.ts';
// ============================== food storage ==============================
export const meatCount = () => S.meatQ.reduce((a,e)=>a+e.n,0);
export const berryCount = () => S.berryQ.reduce((a,e)=>a+e.n,0);
export function addMeat(n?, src?){ S.meatQ.push({n, abs: nowAbs()}); S.tot.food += n; if (src) S.tot[src] = (S.tot[src]||0) + n; }
export function addBerries(n?){ S.berryQ.push({n, abs: nowAbs()}); S.tot.food += n; S.tot.forage += n; }
export function takeMeat(n?){
  let got = 0;
  while (n > 0 && S.meatQ.length){
    const e = S.meatQ[0], t = Math.min(e.n, n);
    e.n -= t; n -= t; got += t;
    if (e.n <= 0) S.meatQ.shift();
  }
  return got;
}
export function takeBerries(n?){
  let got = 0;
  while (n > 0 && S.berryQ.length){
    const e = S.berryQ[0], t = Math.min(e.n, n);
    e.n -= t; n -= t; got += t;
    if (e.n <= 0) S.berryQ.shift();
  }
  return got;
}
export function meatSpoilHours(){ return S.winter ? TUNING.food.unsmokedShelfHoursBelowZero : 24; }
export function oldestMeatSpoiled(){ return S.meatQ.length>0 && (nowAbs() - S.meatQ[0].abs) >= meatSpoilHours(); }
export function oldestBerriesSpoiled(){ return S.berryQ.length>0 && (nowAbs() - S.berryQ[0].abs) >= 72; }
export function cookedMealSpoiled(){ return !!S.cookedMeal && (nowAbs() - S.cookedMeal.abs) >= 12; }
export function discardSpoiledMeat(){ if (S.meatQ.length){ const n=S.meatQ[0].n; S.meatQ.shift(); return n; } return 0; }
export function discardSpoiledBerries(){ if (S.berryQ.length){ const n=S.berryQ[0].n; S.berryQ.shift(); return n; } return 0; }
export function makeSick(days?){ S.sickDays = Math.max(S.sickDays, days); S.tot.sick++; if (S && S.day) markSetback(); }
export function spoilageSting(){ S.morale = clamp(S.morale - 3); S.stress = clamp(S.stress + 6*sensitivityMul()); S.tot.spoilage = (S.tot.spoilage||0) + 1; S.spoilageDays.push(S.day); S.lastSpoilageDay = S.day; }

