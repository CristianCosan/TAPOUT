// Ported from legacy/tap-out-v12.html (lines 1752-1900). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { rand } from './runtime.ts';
import { endGame } from './endings.ts';
import { clamp, pick } from './helpers.ts';
import { hasKit, log, sensitivityMul } from './setup.ts';
import { S } from './state.ts';
import { afterAction } from './threads.ts';
import { showModal } from './ui.ts';
// ============================== v10 §8: medical arcs & the forced tap ==============================
export const MEDICAL_ARCS: any = {
  spiderBite: {
    label:'Spider bite', fixable:true, dosesNeeded:3,
    onset:"Something bit you in the night. Small welt, probably nothing.",
    declared:"The bite site is swollen and hot now, red lines starting to creep up from it. That needs treating, not ignoring.",
  },
  cutInfection: {
    label:'Infected cut', fixable:true, dosesNeeded:4,
    onset:"That cut from the axe slip is weeping more than a clean cut should, this many days on.",
    declared:"The cut's gone bad - hot, swollen, a smell that wasn't there yesterday. This needs real treatment now, or it's going to get worse than a cut has any right to be.",
  },
  giardia: {
    label:'Bad water sickness', fixable:true, dosesNeeded:3,
    onset:"Your gut's been off since that stream water. Probably nothing.",
    declared:"Whatever's in your gut has taken hold properly - cramping, no strength in your legs, running both ways. Boiled water, rest, and treatment, or this cascades.",
  },
  badMeat: {
    label:'Food poisoning', fixable:true, dosesNeeded:2,
    onset:null,
    declared:"Whatever was in that meat has you in real trouble - violent, both ends, and you're already thin enough that it matters more than it should on a full stomach.",
  },
  brokenAnkle: {
    label:'Broken ankle', fixable:false,
    onset:null,
    declared:"You went down hard on the way back from the shore in that rain and heard it before you felt it. Your ankle is broken - not sprained. Broken.",
  },
};
export const ARC_ESCALATION_POOL: any = [
  "It's not getting better. You can feel that much even without a mirror.",
  "Every task today came with a background hum of exactly how bad this actually is.",
  "You caught yourself doing math on how many more days you can push through this.",
  "You're moving like someone twenty years older than you are today, and it isn't an act.",
];
export function triggerMedicalArc(key?){
  if (S.medicalArc || S.over) return;
  const def = MEDICAL_ARCS[key];
  if (!def) return;
  S.medicalArc = {
    key, label:def.label, stage: def.onset ? 'onset' : 'declared',
    day: S.day, daysInStage:0, dosesNeeded: def.dosesNeeded||0, dosesGiven:0,
    fixable: !!def.fixable, forcedTapOnly:false, phoneCount:0,
  };
  if (def.onset){ log(`🩹 ${def.onset}`, 'bad'); }
  else { declareMedicalArc(); }
  if (key === 'brokenAnkle'){ S.injury = {type:'ankle', days:8, broken:true}; }
}
export function declareMedicalArc(){
  const def = MEDICAL_ARCS[S.medicalArc.key];
  S.medicalArc.stage = 'declared'; S.medicalArc.daysInStage = 0;
  showModal(`<h3>${def.label}</h3><div class="wsub">${def.declared}</div><button class="mbtn" onclick="hideModal()">Continue</button>`);
  log(`🩹 ${def.declared}`, 'bad');
  S.stress = clamp(S.stress + 15*sensitivityMul()); S.morale = clamp(S.morale - 10*sensitivityMul());
  S.confessPrompt = true;
}
export function beginArcCrisis(){
  const def = MEDICAL_ARCS[S.medicalArc.key];
  showModal(`<h3>${def.label} - it's bad now</h3><div class="wsub">This has stopped being something you can work around. Your body is telling you, in no uncertain terms, that it's losing.</div><button class="mbtn" onclick="hideModal()">Continue</button>`);
  log(`🩹 ${def.label}: this has turned into a crisis. It's not a background problem anymore.`, 'bad');
}
export function forcedTapPhoneMoment(){
  if (S.over) return;
  showModal(`<h3>The phone. Again.</h3><div class="wsub">There's only one button on the screen this time.</div>
    <button class="mbtn" onclick="hideModal(); endGame('tap')">TAP OUT</button>`);
}
export function forcePhoneMomentArc(isFinal?){
  if (S.over) return;
  if (isFinal){ S.medicalArc.forcedTapOnly = true; forcedTapPhoneMoment(); return; }
  showModal(`<h3>You pick up the phone</h3><div class="wsub">You've had it in your hand more than once these last few days. This time you actually get as far as dialing before you stop yourself.</div>
    <button class="mbtn ghost" onclick="hideModal()">Put it down. Not yet.</button>
    <button class="mbtn" onclick="hideModal(); endGame('tap')">Make the call now</button>`);
}
export function applyPoulticeDose(){
  if (!S.medicalArc || S.medicalArc.stage !== 'treatment') return;
  S.medicalArc.dosesGiven = (S.medicalArc.dosesGiven||0) + 1;
  S.morale = clamp(S.morale + 2);
  log(`🌿 You harvest what you need, brew it at the fire, and apply the poultice. Dose ${S.medicalArc.dosesGiven}/${S.medicalArc.dosesNeeded}.`, 'good');
  afterAction('poultice');
}
export function medicalArcDailyTick(notes?){
  if (!S.medicalArc || S.over) return;
  const arc = S.medicalArc;
  const def = MEDICAL_ARCS[arc.key];
  arc.daysInStage++;
  if (arc.stage === 'onset'){
    declareMedicalArc();
    return;
  }
  if (arc.stage === 'declared'){
    if (arc.fixable){
      arc.stage = 'treatment'; arc.daysInStage = 0;
      notes.push(`🩹 ${arc.label}: time to treat it, if you can - craft a willow poultice and apply it daily.`);
    } else { arc.stage = 'escalation'; arc.daysInStage = 0; }
    return;
  }
  if (arc.stage === 'treatment'){
    if (arc.dosesGiven >= arc.dosesNeeded){
      const soapBonus = hasKit('soap') ? 0.5 : 1;
      if (rand() < 0.15*soapBonus){
        arc.stage = 'escalation'; arc.daysInStage = 0;
        notes.push(`🩹 You did everything right with ${arc.label.toLowerCase()} and it's not enough. Some things don't respond to honest treatment, no matter how careful you were. It's getting worse anyway.`);
      } else {
        notes.push(`🩹 ${arc.label} finally breaks - the treatment held. Sore, worn down, but past the worst of it.`);
        S.arcsSurvived = (S.arcsSurvived||0) + 1;
        S.arcHistory.push({key:arc.key, day:S.day, outcome:'recovered'});
        S.medicalArc = null;
      }
    } else if (arc.daysInStage >= 4){
      arc.stage = 'escalation'; arc.daysInStage = 0;
      notes.push(`🩹 ${arc.label} has gone past the point where the poultice alone is going to fix it now. This is getting worse.`);
    }
    return;
  }
  if (arc.stage === 'escalation'){
    S.stress = clamp(S.stress + 6*sensitivityMul()); S.morale = clamp(S.morale - 5*sensitivityMul());
    S.energyDebt = Math.min(6, S.energyDebt + 1);
    notes.push(pick(ARC_ESCALATION_POOL));
    if (arc.daysInStage >= 2){ arc.stage = 'crisis'; arc.daysInStage = 0; beginArcCrisis(); }
    return;
  }
  if (arc.stage === 'crisis'){
    S.health = clamp(S.health - 8);
    S.stress = clamp(S.stress + 10*sensitivityMul());
    if (arc.daysInStage === 1 || arc.daysInStage === 2){
      arc.phoneCount = (arc.phoneCount||0) + 1;
      forcePhoneMomentArc(arc.phoneCount >= 3);
      return;
    }
    if (arc.daysInStage >= 3 || S.health <= 8){
      if (rand() < 0.55){
        S.deathSource = 'collapse';
        notes.forEach(n=>log(n,'event'));
        endGame('med');
      } else {
        arc.phoneCount = 3;
        forcePhoneMomentArc(true);
      }
    }
  }
}
export function maybeEnvironmentalArc(notes?){
  if (S.medicalArc || S.over) return;
  const soapCut = hasKit('soap') ? 0.5 : 1;
  // v12 §12 re-tune: 0.006->0.004 - the arc's stage day-counts are correctly left unscaled by RUN_SCALE
  // ("day-texture stays untouched"), but that means a fixed ~9-day arc now eats a much bigger share of
  // the compressed ~19-day median run than it did in v11's ~30-day one; onset odds needed to come down
  // to compensate, which they hadn't been.
  if (rand() < 0.004*soapCut) triggerMedicalArc('spiderBite');
  else if (rand() < 0.004*soapCut) triggerMedicalArc('cutInfection');
}

