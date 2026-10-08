// Ported from legacy/tap-out-v12.html (lines 2095-2308). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { rand } from './runtime.ts';
import { WHO_LABEL } from './camp.ts';
import { eCost, eTime, healthCeiling, kcalBurnRate, shiveringActive, warmthDrainRate } from './cost.ts';
import { endGame } from './endings.ts';
import { clamp, duskHour } from './helpers.ts';
import { pushModifier, removeModifier } from './modifiers.ts';
import { resolveDelta } from './resolve.ts';
import { curfewCapForLoc, log, sensitivityMul } from './setup.ts';
import { S } from './state.ts';
import { TUNING, WEATHER } from './tuning.ts';
import { render, showModal, toastRefusal, typewriterInto } from './ui.ts';
// ============================== v6.2: personal threads ==============================
export function checkThreads(notes?){
  if (S.firstKill && !S.threadState.vowMade){
    S.threadState.vowMade = true; S.threadState.vowBroken = false; S.threadState.vowResolved = false;
    notes.push(`🩸 Something in you promised that animal its death would mean something. You intend to keep it.`);
  }
  if (S.threadState.vowMade && !S.threadState.vowResolved && !S.threadState.vowBroken && S.day - S.firstKill.day >= 8){
    S.threadState.vowResolved = true;
    resolveDelta(5, notes);
    notes.push(`🩸 More than a week on, and the promise from that first kill still holds. It mattered. It still does.`);
  }
}
export function showForcedTapoutCinematic(){
  S.forcedTapoutPending = false;
  S.forcedTapout = true;
  S.deathSource = null;
  const who = WHO_LABEL[S.backstory.who] || 'no one in particular';
  const text = `You don't remember deciding. The phone is just in your hand, and your thumb is already moving. Day ${S.day}. ${S.rivals} rival${S.rivals===1?'':'s'} still out there, and you're not one of the ones who's going to find out how it ends. You think of ${who}, and the line rings, and you find you're relieved. That's the part nobody tells you - how much it feels like relief.`;
  showModal(`
    <h3>Day ${S.day}</h3>
    <div class="wsub">Something in you already decided.</div>
    <div class="wsub tw" id="twForced" onclick="skipTypewriter('twForced')"></div>
    <button class="mbtn" onclick="hideModal(); endGame('tap')">Let it happen</button>
  `);
  typewriterInto('twForced', text, 20);
}
export function accrueExposure(h?, outdoor?){
  if (!outdoor || S.loc === 'camp') return;
  const w = WEATHER[S.weather];
  const rainy = w.wetGain > 0;
  const gain = (rainy ? TUNING.exposure.perRainHour : TUNING.exposure.perColdHour) * h;
  S.exposureToday = (S.exposureToday||0) + gain;
  if (!S.soakedThrough && S.exposureToday >= TUNING.exposure.soakedThreshold){
    S.soakedThrough = true;
    S.dryHoursAccum = 0;
    S.conditions.soakedThrough.active = true;
    pushModifier('soakedThrough', '💧 Soaked Through', `Warmth can't climb past ${TUNING.exposure.soakedWarmthCap} until your gear dries by the fire (~${TUNING.exposure.dryHoursNeeded}h). You're also Shivering: everything costs 1.5x time and 2x energy until it clears.`, 'neg');
    log('💧 You\'re soaked clean through. Whatever the fire gives back tonight, it isn\'t going to feel like enough.', 'bad');
  }
}
export function tickDryingAtFire(h?){
  if (!S.soakedThrough) return;
  if (S.loc === 'camp' && S.fireH > 0){
    S.dryHoursAccum = (S.dryHoursAccum||0) + h;
    if (S.dryHoursAccum >= TUNING.exposure.dryHoursNeeded){
      S.soakedThrough = false;
      S.conditions.soakedThrough.active = false;
      removeModifier('soakedThrough');
      log('🔥 Gear\'s dry at last. The fire finally feels like it\'s doing something.', 'good');
    }
  }
}
// v12 §4.2: Shivering clears after ~3-4 cumulative fire-rest hours - actRest at a lit camp fire and
// sleep-with-fire hours both count toward the same accumulator.
export function tickShiverClear(h?){
  if (!shiveringActive()){ S.shiverClearHours = 0; return; }
  if (S.loc === 'camp' && S.fireH > 0){
    S.shiverClearHours = (S.shiverClearHours||0) + h;
    if (S.shiverClearHours >= TUNING.shivering.clearHoursNeeded && !S.soakedThrough && !(S.conditions.aCold && S.conditions.aCold.active)){
      S.shiverClearHours = 0;
      log('🔥 The shivering finally lets go - warm enough, long enough, for it to matter.', 'good');
    }
  }
}
export function tickHours(h?, outdoor?, tags=''){
  if (h<=0) return;
  const w = WEATHER[S.weather];
  S.hunger = clamp(S.hunger - TUNING.depletion.hungerPerHourDay*h);
  S.thirst = clamp(S.thirst - TUNING.depletion.thirstPerHourDay*h);
  const burn = kcalBurnRate(tags) * h;
  S.kcal -= burn;
  S.kcalBurn += burn;
  if (outdoor) S.wet = clamp(S.wet + w.wetGain*h);
  accrueExposure(h, outdoor);
  if (S.loc === 'camp'){
    if (S.fireH > 0){
      const used = Math.min(S.fireH, h);
      S.fireH = Math.max(0, S.fireH - h);
      S.warmth = clamp(S.warmth + 5*used, 0, S.soakedThrough ? TUNING.exposure.soakedWarmthCap : 100);
      S.wet = clamp(S.wet - 9*used);
      tickDryingAtFire(used);
      tickShiverClear(used);
      if (h > used){
        const rem = h - used;
        S.wet = clamp(S.wet - 2*rem);
        const dr = warmthDrainRate(outdoor) * 0.7;
        S.warmth = clamp(S.warmth - dr*rem);
      }
    } else {
      if (S.fireH > 0) S.fireH = Math.max(0, S.fireH - h);
      S.wet = clamp(S.wet - 2*h);
      const work = outdoor ? 0.85 : 1;
      const dr = warmthDrainRate(outdoor) * work;
      S.warmth = clamp(S.warmth - dr*h);
    }
    S.hoursOutsideStreak = 0;
  } else {
    S.wet = clamp(S.wet - 1*h);
    let remaining = h, elapsed = S.hoursOutsideStreak || 0, drained = 0;
    const T = TUNING.outdoorWarmthDrain;
    const rainy = w.wetGain > 0;
    const postFreeze = S.day >= S.zeroCrossDay;
    while (remaining > 0){
      const rate = elapsed < T.tier1Hours ? T.tier1PerHour : elapsed < T.tier1Hours+T.tier2Hours ? T.tier2PerHour : T.tier3PerHour;
      const step = Math.min(remaining, 0.25);
      let r = rate;
      if (rainy) r *= T.rainMultiplier;
      if (postFreeze) r *= TUNING.temperature.postFreezeMultiplier;
      drained += r * step;
      elapsed += step; remaining -= step;
    }
    S.warmth = clamp(S.warmth - drained);
    S.hoursOutsideStreak = elapsed;
    if (S.warmth < 40){
      S.morale = clamp(S.morale - 1*h*sensitivityMul());
      S.stress = clamp(S.stress + 1*h*sensitivityMul());
    }
  }
  if (S.hunger <= 0){ S.stress = clamp(S.stress + 0.35*h); S.morale = clamp(S.morale - 0.15*h); }
  if (S.thirst <= 0){ S.stress = clamp(S.stress + 0.45*h); S.morale = clamp(S.morale - 0.15*h); }
  if (S.warmth <= 0){ S.stress = clamp(S.stress + 0.3*h); }
  S.hour += h;
  if (S.hunger <= 0) S.health = clamp(S.health - h*TUNING.depletion.healthDrainHunger, 0, healthCeiling());
  if (S.thirst <= 0) S.health = clamp(S.health - h*TUNING.depletion.healthDrainThirst, 0, healthCeiling());
  if (S.warmth <= 0) S.health = clamp(S.health - h*TUNING.depletion.healthDrainWarmth, 0, healthCeiling());
  S.minHealth = Math.min(S.minHealth, S.health);
  // v12 §11.1: hour invariant - normalize away from the raw scale immediately if a caller ever lets it
  // exceed the hard 6am-to-6am wrap unexpectedly (the dev assertion below catches the *cause*).
  if (S.hour >= TUNING.night.hardCapHour + 0.001){
    console.error(`[anti-freeze] S.hour reached ${S.hour.toFixed(3)} (>=${TUNING.night.hardCapHour}) outside the sleep transition - clamping. Call path: tickHours(${h},${outdoor},'${tags}')`);
    S.hour = TUNING.night.hardCapHour - 0.01;
  }
  if (S.hour >= duskHour() && !S.darkLogged){ S.darkLogged = true; log('Darkness falls over the lake.'); }
}
export function isNightNow(){ return S.hour >= TUNING.night.startHour || S.hour < 6; }
export function accruePastCurfewDebt(beforeHour?, h?){
  const overlapStart = Math.max(beforeHour, 24);
  const overlapEnd = Math.min(beforeHour + h, TUNING.night.hardCapHour);
  const hrs = Math.max(0, overlapEnd - overlapStart);
  if (hrs > 0) S.energyDebt = Math.min(6, S.energyDebt + hrs * TUNING.night.debtPerHourPastMidnight);
}
export function maybeSlip(nightRisk?){
  const w = WEATHER[S.weather];
  if (!w.slip || S.injury) return;
  const weatherRisk = (S.weather === 'rain' || S.weather === 'storm');
  const chance = w.slip * (nightRisk ? TUNING.night.injuryChanceMultiplier : 1) * (weatherRisk ? 2 : 1);
  if (rand() < chance){
    const r = rand();
    if (r < 0.45){
      S.injury = {type:'ankle', days:3}; S.tot.injuries++;
      S.stress = clamp(S.stress + 10); S.morale = clamp(S.morale - 6);
      log('Your boot skids off a wet root and your ankle folds under you. Sprained, not broken - everything on foot just got harder for a few days.', 'bad');
    } else if (r < 0.75){
      S.injury = {type:'wrist', days:3}; S.tot.injuries++;
      S.stress = clamp(S.stress + 10); S.morale = clamp(S.morale - 6);
      log('You go down hard on the slick rock and catch yourself wrong. Your wrist is swelling - hand work just got harder. (3 days)', 'bad');
    } else {
      S.wet = 100; S.warmth = clamp(S.warmth - 25); S.stress = clamp(S.stress + 10);
      log('You slip and go in up to your chest. Soaked through, teeth already chattering - you need fire, now.', 'bad');
    }
  }
}
// v12 §11.2: no silent refusals. Every spend()/spendOrDebt() failure records WHY into S.lastRefusalReason
// so the caller (a UI button) can toast it instead of just doing nothing. The button subtitle already
// carries the reason when disabled; this covers the case where a live-looking enabled button is pressed
// and still can't legally resolve (a race between render() and the click).
export function refuse(reason?){ S.lastRefusalReason = reason; toastRefusal(reason); return false; }
export function spend(cost?, hrs?, outdoor?, tags='', cap?){
  if (cap === undefined) cap = curfewCapForLoc(S.loc);
  const c = eCost(cost, tags);
  let h = eTime(hrs, tags);
  if (S.over) return false;
  const physical = (outdoor || tags.includes('w')) && h > 0;
  const night = isNightNow() && physical;
  if (night) h *= TUNING.night.timeMultiplier;
  if (S.energy < c) return refuse("You don't have the energy for that right now.");
  if (S.hour + h > cap) return refuse("Too late in the day - you'd be finishing that in the dark past any sense.");
  const beforeHour = S.hour;
  const fireLit = S.fireH > 0 && S.loc === 'camp';
  S.energy -= c;
  if (h > 0) tickHours(h, outdoor, tags);
  if (night) S.stress = clamp(S.stress + (fireLit ? TUNING.night.stressPerHourFireLit : TUNING.night.stressPerHour) * h * sensitivityMul());
  if (h > 0) accruePastCurfewDebt(beforeHour, h);
  if (outdoor) maybeSlip(night);
  return true;
}
export function spendOrDebt(cost?, hrs?, cap?, tags=''){
  if (cap === undefined) cap = curfewCapForLoc(S.loc);
  if (S.over) return false;
  const h = eTime(hrs, tags);
  if (S.hour + h > cap) return refuse("Too late in the day - you'd be finishing that in the dark past any sense.");
  const beforeHour = S.hour;
  const c = eCost(cost, tags);
  if (S.energy >= c){
    S.energy -= c;
  } else {
    S.energyDebt = Math.min(6, S.energyDebt + (c - S.energy));
    S.energy = 0;
  }
  if (h > 0){ tickHours(h, false); accruePastCurfewDebt(beforeHour, h); }
  return true;
}
export function afterAction(act?){
  if (act){ S.lastAct = act; S.acts[act] = (S.acts[act]||0) + 1; }
  if (S.health <= 0){ if (!S.deathSource) S.deathSource = 'collapse'; endGame('dead'); return; }
  render();
}

