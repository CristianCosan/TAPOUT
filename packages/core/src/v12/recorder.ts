// Ported from legacy/tap-out-v12.html (lines 1175-1193). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { ambientTempC } from './cost.ts';
import { nowAbs } from './helpers.ts';
import { computeBMI } from './setup.ts';
import { S, SETTINGS } from './state.ts';
// ============================== v8 §6 + v10/v11: run recorder (settings toggle) ==============================
export const RECORDER: any = {seed:null, events:[], flags:[], snapshots:[]};
export function recLog(kind?, data?){
  if (!SETTINGS.runRecorder || !S) return;
  RECORDER.events.push({t: nowAbs(), day:S.day, hour:S.hour, kind, data});
  if (RECORDER.events.length > 20000) RECORDER.events.shift();
}
export function flagMoment(note?){
  if (!S) return;
  const snapshot = JSON.parse(JSON.stringify(S));
  RECORDER.flags.push({t: nowAbs(), note: note||'', snapshot, recentLog: S.log.slice(0,50)});
}
export function recordDailySnapshot(){
  if (!SETTINGS.runRecorder || !S) return;
  RECORDER.snapshots.push({
    day: S.day, warmth: +S.warmth.toFixed(1), stress: +S.stress.toFixed(1), morale: +S.morale.toFixed(1),
    weight: +S.weight.toFixed(2), energy: S.energy, maxEnergy: S.maxEnergy, health: +S.health.toFixed(1),
    tempC: ambientTempC(false), bmi: computeBMI(), exposure: +(S.exposureToday||0).toFixed(2), soaked: !!S.soakedThrough,
  });
}

