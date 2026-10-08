// Ported from legacy/tap-out-v12.html (lines 1506-1620). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { meatCount } from './food.ts';
import { clamp, nowAbs } from './helpers.ts';
import { tagAxisValue } from './interior.ts';
import { pushModifier, removeModifier } from './modifiers.ts';
import { hasKit, sensitivityMul } from './setup.ts';
import { S } from './state.ts';
import { TUNING } from './tuning.ts';
// ============================== v7 §3: the worry ledger ==============================
export function conditionCeiling(){
  let cap = 100;
  if (S.conditions.bearDread.active) cap = Math.min(cap, 70);
  if (S.conditions.raiderSiege.active) cap = Math.min(cap, 80);
  if (S.conditions.rotStreak.active) cap = Math.min(cap, 85);
  if (S.conditions.wetBedding.active) cap = Math.min(cap, 85);
  if (S.conditions.coldSnap.active) cap = Math.min(cap, 85);
  return cap;
}
export function enforceMoraleCeiling(){
  const cap = conditionCeiling();
  if (S.morale > cap) S.morale = cap;
}
export function bearDreadStressFloor(){
  if (!S.conditions.bearDread.active) return 0;
  return S.structure >= 1 ? 20 : 40;
}
export function triggerBearDread(){
  S.conditions.bearDread.active = true;
  S.conditions.bearDread.quietDays = 0;
  S.bearDreadDay = S.day;
  S.conditions.nightFright.active = true;
  S.conditions.nightFright.quietDays = 0;
  pushModifier('nightFright', '🌑 Night Fright', 'The dark outside camp doesn\'t feel neutral anymore. Fades after a run of quiet nights - faster if you\'ve leaned tender or cautious.', 'neg');
}
export function worryLedgerDailyTick(notes?){
  const c = S.conditions;
  const capAtStart = conditionCeiling();
  if (c.bearDread.active){
    c.bearDread.quietDays++;
    if (S.structure >= 2 || c.bearDread.quietDays >= 6){
      c.bearDread.active = false;
      notes.push('🐻 The dread has finally loosened its grip - the walls hold, and you believe it now.');
    } else {
      S.morale = clamp(S.morale - 4*sensitivityMul());
      const floor = bearDreadStressFloor();
      if (S.stress < floor) S.stress = floor;
      notes.push(`🐻 Bear Dread - the walls still feel thin. −4 morale, stress won't drop below ${floor}.`);
    }
  }
  if (c.nightFright.active){
    c.nightFright.quietDays++;
    const tenderCautious = tagAxisValue('tender') + tagAxisValue('cautious');
    const clearDays = 4 + Math.max(0, 3 - Math.floor(tenderCautious/3));
    if (c.nightFright.quietDays >= clearDays){
      c.nightFright.active = false;
      removeModifier('nightFright');
      notes.push('🌑 The fear of the dark outside has finally eased its grip.');
    } else {
      S.stress = clamp(S.stress + 2*sensitivityMul());
      notes.push('🌑 Night Fright still lingers - the dark past the firelight isn\'t just dark anymore.');
    }
  }
  if (c.raiderSiege.active){
    const stored = meatCount() + S.smoked + (S.smokingSession?S.smokingSession.n:0) + (S.hugeSmokingSession?S.hugeSmokingSession.n:0);
    if (S.iceCache || stored <= 0){
      c.raiderSiege.active = false; c.raiderSiege.stacks = 0;
      notes.push(stored <= 0 ? '🦡 There\'s nothing left for it to come back for. The siege breaks, for what that\'s worth.' : '🦡 The cache finally holds. Whatever\'s been circling camp gives up on it.');
    } else {
      const hit = c.raiderSiege.stacks * 2;
      S.morale = clamp(S.morale - hit*sensitivityMul());
      notes.push(`🦡 Raider Siege - another night of it. −${hit} morale.`);
    }
  }
  S.spoilageDays = S.spoilageDays.filter(d => S.day - d <= 3);
  if (!c.rotStreak.active && S.spoilageDays.length >= 2) c.rotStreak.active = true;
  if (c.rotStreak.active){
    const daysSinceLoss = S.day - S.lastSpoilageDay;
    if (daysSinceLoss >= 3){
      c.rotStreak.active = false;
      notes.push('🥓 Nothing\'s turned in days. The rot streak finally breaks.');
    } else {
      S.morale = clamp(S.morale - 2*sensitivityMul());
      notes.push('🥓 Rot Streak - too much has gone bad too fast. −2 morale.');
    }
  }
  c.wetBedding.active = !!S.chains.roof;
  if (c.wetBedding.active){
    S.morale = clamp(S.morale - 2*sensitivityMul());
    notes.push('💧 Wet Bedding - everything you own is damp. −2 morale, and sleep doesn\'t really land.');
  }
  if (S.warmth < 30){ c.coldSnap.coldStreak++; c.coldSnap.warmStreak = 0; }
  else if (S.warmth >= 45){ c.coldSnap.warmStreak++; c.coldSnap.coldStreak = 0; }
  if (!c.coldSnap.active && c.coldSnap.coldStreak >= 2) c.coldSnap.active = true;
  if (c.coldSnap.active){
    if (c.coldSnap.warmStreak >= 2){ c.coldSnap.active = false; notes.push('🔥 Two solid warm nights in a row - the cold snap finally breaks its hold.'); }
    else { S.morale = clamp(S.morale - 2*sensitivityMul()); notes.push('❄️ Cold Snap Fatigue - you can\'t seem to get warm through the night. −2 morale, energy ceiling trimmed.'); }
  }
  if (c.aCold.active){
    c.aCold.daysLeft--;
    S.stress = clamp(S.stress + 2*sensitivityMul());
    if (c.aCold.daysLeft <= 0){
      c.aCold.active = false;
      removeModifier('aCold');
      notes.push('🤧 The cold you\'ve been fighting finally breaks.');
    } else {
      notes.push(`🤧 Still sniffling and worn down with this cold - ${c.aCold.daysLeft} day${c.aCold.daysLeft===1?'':'s'} left in you, feels like.`);
    }
  }
  // v12 §9.2: Moldy smoked food - a new condition, active whenever any smoked batch is past 60% of
  // its shelf life. Tooltip (renderModifierRow) states live time-to-mold, and that salt slows it.
  const nearMoldy = S.smokedBatches.some(b => (nowAbs()-b.abs) >= smokedShelfHours()*0.6);
  if (nearMoldy && !c.moldyStock.active){ c.moldyStock.active = true; pushModifier('moldyStock', '🥓 Moldy smoked food', moldyTooltip(), 'neg'); }
  else if (!nearMoldy && c.moldyStock.active){ c.moldyStock.active = false; removeModifier('moldyStock'); }
  else if (nearMoldy) pushModifier('moldyStock', '🥓 Moldy smoked food', moldyTooltip(), 'neg');
  if (S.morale > capAtStart) S.morale = capAtStart;
  enforceMoraleCeiling();
}
export function smokedShelfHours(){ return TUNING.food.smokedShelfHoursAboveZero * (hasKit('salt') ? TUNING.food.saltMoldMultiplier : 1); }
export function moldyTooltip(){
  const oldest = S.smokedBatches[0];
  if (!oldest) return 'Smoked stock at risk of turning.';
  const hoursLeft = Math.max(0, Math.round(smokedShelfHours() - (nowAbs()-oldest.abs)));
  return `The oldest batch has about ${hoursLeft}h before it molds past saving.${hasKit('salt') ? ' Salt is already buying you triple the shelf life.' : ' Salt (if you\'d drafted it) would triple this.'}`;
}

