// Ported from legacy/tap-out-v12.html (lines 652-5118). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { rand } from './runtime.ts';
import { S } from './state.ts';
import { RUN_SCALE_FACTOR } from './tuning.ts';
export const clamp = (v, lo=0, hi=100) => Math.max(lo, Math.min(hi, v));
export const pick = a => a[Math.floor(rand()*a.length)];
// picks from a pool, avoiding an immediate repeat of the last value drawn (tracked on S under stateKey)
export function pickNoRepeat(pool?, stateKey?){
  if (pool.length <= 1) return pool[0];
  let choice;
  do { choice = pick(pool); } while (choice === S[stateKey]);
  S[stateKey] = choice;
  return choice;
}
export const shuffle = a => { for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
export function hh(h?){
  const t = Math.max(0, h) % 24;
  let whole = Math.floor(t), mins = Math.round((t-whole)*60);
  if (mins >= 60){ mins -= 60; whole += 1; }
  if (whole >= 24) whole -= 24;
  return String(whole).padStart(2,'0') + ':' + String(mins).padStart(2,'0');
}
export const TRAVEL_HOURS = 0.5;
export const nowAbs = () => S.day*24 + S.hour;
// v12 §3.3: photoperiod - days get shorter from day 1, not from snowfall. Sunset drifts from ~21:30 on
// day 1 toward a floor of ~16:45 deep in the run, shrinking a compression-scaled amount per day; dawn
// drifts later a smaller amount. Replaces the old winterDay-keyed duskHour() entirely.
export function duskHour(){
  if (!S) return 21.5;
  const shrinkPerDay = 9/60 * RUN_SCALE_FACTOR; // ~8-10 min/day at RUN_SCALE=56 (v11 baseline pacing)
  const d = clamp(21.5 - shrinkPerDay*(S.day-1), 16.75, 21.5);
  return d;
}
export function dawnHour(){
  if (!S) return 6;
  const driftPerDay = 2.5/60 * RUN_SCALE_FACTOR;
  return clamp(6 + driftPerDay*(S.day-1), 6, 8.5);
}

// ============================== render ==============================
// v12 §10.1: EVERY interpolated number in every popup/log/note routes through roundDisplay - the rule
// is fractional >=.3 rounds up, <.3 rounds down, integers only on display (weight/BMI keep their own
// explicit .toFixed(1) call sites, which is a different, intentional one-decimal rule per §10.1).
export function roundDisplay(v?){
  if (typeof v !== 'number' || !isFinite(v)) return v;
  const floor = Math.floor(v);
  return (v - floor) >= 0.3 - 1e-9 ? floor + 1 : floor;
}

