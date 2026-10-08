// Ported from legacy/tap-out-v12.html (lines 5664-5689). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { shiveringActive } from './cost.ts';
import { roundDisplay } from './helpers.ts';
import { hasKit } from './setup.ts';
import { S } from './state.ts';
import { TUNING } from './tuning.ts';
import { smokedShelfHours } from './worry.ts';
// ============================== v12 §9: the modifier row, now the canonical teaching-tooltip surface ==============================
export function pushModifier(id?, label?, desc?, cls?, expiresInDays?){
  removeModifier(id);
  const m: any = {id,label,desc,cls};
  if (expiresInDays) m.expiresDay = S.day + expiresInDays;
  S.modifiers.push(m);
}
export function removeModifier(id?){ S.modifiers = S.modifiers.filter(m=>m.id!==id); }
export function pruneExpiredModifiers(){ S.modifiers = S.modifiers.filter(m => !m.expiresDay || S.day < m.expiresDay); }
export function liveModifiers(){
  const extra = [];
  if (S.conditions.rotStreak.active){
    const belowZero = S.winter ? `${TUNING.food.unsmokedShelfHoursBelowZero}h` : '24h';
    extra.push({id:'rotStreakTip', label:'🥓 Rot Streak', desc:`Fresh meat spoils in ~${belowZero==='24h'?'24h at these temps':belowZero+' once below freezing'}; smoked meat holds ~${Math.round(smokedShelfHours())}h${hasKit('salt')?' (salt is already tripling this)':' - salt would triple it'}.`, cls:'neg'});
  }
  if (shiveringActive()){
    extra.push({id:'shiveringTip', label:'🥶 Shivering', desc:`All activity costs ${TUNING.shivering.timeMul}x time and ${TUNING.shivering.energyMul}x energy. Clears after ~${TUNING.shivering.clearHoursNeeded}h at a lit camp fire (${(S.shiverClearHours||0).toFixed(1)}h banked so far).`, cls:'neg'});
  }
  if (S.energyDebt > 0){
    extra.push({id:'energyDebtTip', label:'🔋 Energy Debt', desc:`${roundDisplay(S.energyDebt)} borrowed energy comes due at dawn, trimmed straight off tomorrow's max energy.`, cls:'neg'});
  }
  if (S.ankleSalvage){
    const daysLeft = Math.max(0, S.ankleSalvage.deadlineDay - S.day);
    extra.push({id:'salvageClockTip', label:'⏳ Salvage Clock', desc:`${S.ankleSalvage.stat} needs to reach 35-40+ within ${daysLeft} day${daysLeft===1?'':'s'}, or the run ends.`, cls:'neg'});
  }
  return extra;
}

