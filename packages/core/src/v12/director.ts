// Ported from legacy/tap-out-v12.html (lines 2055-2093). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { rand } from './runtime.ts';
import { addBerries, addMeat, meatCount } from './food.ts';
import { clamp, pick } from './helpers.ts';
import { S } from './state.ts';
// ============================== v6.3: the director ==============================
export function markSetback(){ S.lastSetbackDay = S.day; }
export function comfortIndex(){
  const foodDays = (meatCount()+S.smoked) / 3;
  let ci = 0;
  ci += clamp(foodDays*8, 0, 25);
  ci += S.warmth*0.2;
  ci += S.health*0.2;
  ci += S.morale*0.15;
  ci += Math.min(10, S.day - (S.lastSetbackDay||1)) * 2.5;
  return clamp(Math.round(ci), 0, 100);
}
export function directorTick(notes?){
  const ci = comfortIndex();
  S.lastCI = ci;
  if (ci >= 70) S.highCIStreak = (S.highCIStreak||0) + 1; else S.highCIStreak = 0;
  if (S.highCIStreak >= 3){
    S.highCIStreak = 0;
    S.wet = clamp(S.wet + 35);
    markSetback();
    notes.push('🌧 Comfortable as things have been, something always finds the gap - you come back damp and chilled in a way that\'s going to cost you tonight.');
  }
  if (ci <= 25) S.brutalStreak = (S.brutalStreak||0) + 1; else S.brutalStreak = 0;
  if (S.brutalStreak >= 3 && rand() < 0.5){
    S.brutalStreak = 0;
    const gifts = [
      () => { addBerries(3); notes.push('🍀 The land gives, for once - a berry patch loaded and untouched. +3 berries'); },
      () => { S.morale = clamp(S.morale+10); notes.push('🍀 A still, warm, easy day drops into your lap out of nowhere. It doesn\'t fix anything. It still helps. +morale'); },
      () => { addMeat(3,'forage'); notes.push('🍀 A grouse practically walks into camp. +3 meat, easiest thing you\'ve done all week.'); },
    ];
    pick(gifts)();
  }
  if (S.predatorFixation && S.structure < 2){
    S.stress = clamp(Math.max(S.stress, 40));
    notes.push('🏕 You can\'t stop thinking about how thin these walls are. Building this up feels less like comfort now and more like survival.');
  } else if (S.predatorFixation && S.structure >= 2){
    S.predatorFixation = false;
    notes.push('🏕 The walls finally feel like they mean something. That fixation eases, some.');
  }
}

