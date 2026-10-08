// Ported from legacy/tap-out-v12.html (lines 5699-5772). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { rand } from './runtime.ts';
import { meatCount } from './food.ts';
import { clamp, pick } from './helpers.ts';
import { forcedTapPhoneMoment } from './medical.ts';
import { pushModifier, removeModifier } from './modifiers.ts';
import { resolveDelta } from './resolve.ts';
import { log } from './setup.ts';
import { S } from './state.ts';
import { applyTagDeltas } from './tags.ts';
import { render, showModal } from './ui.ts';
// ============================== v11 §7: morale zero has teeth ==============================
export const BREAKDOWN_POOL: any = [
  {text:'You sit down to just check one thing and wake up an hour later, task abandoned, no memory of deciding to stop.', effect:()=>{ S.energy = Math.max(0, S.energy-6); }},
  {text:"You can't make yourself go check the lines this morning. Just can't. You know it's costing you and you do it anyway.", effect:()=>{}},
  {text:"You leave the pot out in the rain and don't notice for hours. Small thing. It still costs you.", effect:()=>{ S.rawWater = Math.max(0, S.rawWater-1); }},
  {text:'You sit an hour past when you meant to get up, staring at nothing in particular.', effect:()=>{ S.energyDebt = Math.min(6, S.energyDebt+1); }},
];
export function offerBreakdownChoice(ev?){
  showModal(`<h3>Not today</h3><div class="wsub">${ev.text}</div>
    <button class="mbtn" onclick="hideModal(); resolveBreakdownChoice('coax')">Coax yourself through it</button>
    <button class="mbtn ghost" onclick="hideModal(); resolveBreakdownChoice('allow')">Let it happen. You need this.</button>
    <button class="mbtn ghost" onclick="hideModal(); resolveBreakdownChoice('push')">Push through anyway</button>`);
}
export function resolveBreakdownChoice(mode?){
  S._pendingBreakdownChoice = null;
  if (mode === 'coax'){ applyTagDeltas({tender:1}); S.morale = clamp(S.morale+2); log('You talk yourself through it, gently, the way you would anyone else. It helps, a little.', 'good'); }
  else if (mode === 'allow'){ applyTagDeltas({humble:1}); S.stress = clamp(S.stress-6); log("You let it happen. Sometimes allowing it is the correct call, not a failure.", 'sys'); }
  else { applyTagDeltas({hard:1}); S.energy = Math.max(0, S.energy-10); log('You push through it anyway, on will alone. It costs you.', 'bad'); }
  render();
}
export function breakdownDailyTick(notes?){
  if (S.over) return;
  if (S.morale > 0){ S.moraleZeroDays = 0; return; }
  S.moraleZeroDays = (S.moraleZeroDays||0) + 1;
  if (S.moraleZeroDays < 2) return;
  S.breakdownStreakDays = (S.breakdownStreakDays||0) + 1;
  if (rand() < 0.6){
    S.breakdownEventsToday = (S.breakdownEventsToday||0) + 1;
    const ev = pick(BREAKDOWN_POOL);
    ev.effect();
    notes.push(`😞 ${ev.text}`);
    S._pendingBreakdownChoice = ev;
  }
  maybeVowCard(notes);
}
export const VOW_TEMPLATES: any = {
  food: {label:'Vow (food)', mk:(d)=>`If I'm not eating something real by day ${d}, I'm done pretending this is working.`},
  warmth: {label:'Vow (warmth)', mk:()=>`One more night this cold and I'm calling it.`},
  fear: {label:'Vow (fear)', mk:()=>`If that thing comes back once more, I'm not staying to find out what happens after.`},
  loneliness: {label:'Vow (loneliness)', mk:(d)=>`If I'm still talking to nobody but myself by day ${d}, that's the sign.`},
};
export function maybeVowCard(notes?){
  if (S.vow || S.over) return;
  if (rand() > 0.5) return;
  let key = null;
  if (S.moraleZeroDays >= 2) key = 'loneliness';
  if ((meatCount()+S.smoked) <= 0 && (S.hungerStreakDays||0) >= 2) key = 'food';
  if (S.warmth < 25) key = 'warmth';
  if (S.conditions.nightFright.active || S.conditions.bearDread.active) key = 'fear';
  if (!key) return;
  const deadline = S.day + 1 + Math.floor(rand()*2);
  const tpl = VOW_TEMPLATES[key];
  const text = tpl.mk(deadline);
  S.vow = {key, label:tpl.label, text, deadline, day:S.day};
  pushModifier('vow', `🕯 ${tpl.label}`, `"${text}" (${deadline-S.day} days left)`, 'neg');
  notes.push(`💭 "${text}"`);
}
export function checkVowDeadline(notes?){
  if (!S.vow || S.over) return;
  if (S.day < S.vow.deadline) return;
  const improved = (S.vow.key==='food' && (meatCount()+S.smoked)>0) ||
    (S.vow.key==='warmth' && S.warmth>=50) ||
    (S.vow.key==='fear' && !S.conditions.nightFright.active && !S.conditions.bearDread.active) ||
    (S.vow.key==='loneliness' && S.morale>15);
  removeModifier('vow');
  if (improved){
    notes.push('🕯 The thing you swore over, that day - it actually turned around in time. Something in you goes to its knees with relief, quietly, where nobody\'s watching, and you stay.');
    resolveDelta(6, notes);
    S.vow = null;
  } else {
    S.vow = null;
    notes.forEach(n=>log(n,'event'));
    forcedTapPhoneMoment();
  }
}

