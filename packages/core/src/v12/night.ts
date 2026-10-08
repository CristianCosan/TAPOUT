// Ported from legacy/tap-out-v12.html (lines 3762-4554). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { rand } from './runtime.ts';
import { checkAnkleSalvage } from './breakSequence.ts';
import { breakdownDailyTick, checkVowDeadline } from './breakdown.ts';
import { activeChainCount, teethTierForStreak } from './camp.ts';
import { cardSchedulerTick } from './cards.ts';
import { healthCeiling, phaseOf, warmthDrainRate, weightLossPct } from './cost.ts';
import { directorTick, markSetback } from './director.ts';
import { endGame, showNightModal } from './endings.ts';
import { addBerries, makeSick, meatCount, takeMeat } from './food.ts';
import { clamp, hh, nowAbs, pick, roundDisplay } from './helpers.ts';
import { hasTrait, pickDailyMonologue, pickDawnLine, pickDream } from './interior.ts';
import { maybeEnvironmentalArc, medicalArcDailyTick } from './medical.ts';
import { pruneExpiredModifiers } from './modifiers.ts';
import { crowNamingTick, jayDailyTick, maybeCallbackLine, maybeWriteLetter, smokedCount, takeSmoked } from './person.ts';
import { recordDailySnapshot } from './recorder.ts';
import { checkBreakingPoint, checkPromise, maybeGeneratePromise, resolveDelta } from './resolve.ts';
import { computeBMI, hasKit, log, rollPredatorNext, rollWeather, sensitivityMul, tempFor } from './setup.ts';
import { S, SETTINGS } from './state.ts';
import { checkThreads, showForcedTapoutCinematic, tickDryingAtFire, tickShiverClear } from './threads.ts';
import { queueLocNews } from './travel.ts';
import { GAME, LONELY_LINES, TUNING, computeMaxEnergy, contextualTapReason } from './tuning.ts';
import { render, sfxFinalTwo, showModal } from './ui.ts';
import { enforceMoraleCeiling, smokedShelfHours, triggerBearDread, worryLedgerDailyTick } from './worry.ts';
// ============================== night / new day ==============================
export function actTurnInEarly(){
  if (S.over) return;
  actSleep(true);
}
export function actSleep(early?){
  if (S.over) return;
  if (!early && S.hour < 16) return;
  if (early){
    S.morale = clamp(S.morale - 4);
    S.turnedInEarlyStreak = (S.turnedInEarlyStreak||0) + 1;
  } else S.turnedInEarlyStreak = 0;
  const notAtCamp = S.loc !== 'camp';
  S.loc = 'camp';
  const notes = [];
  if (early && S.turnedInEarlyStreak >= 3){ notes.push('😔 The evenings have started to feel like the hardest part of the day. −stress'); resolveDelta(-3, notes); }
  if (early) S.stress = clamp(S.stress + (S.turnedInEarlyStreak>=3?5:2));
  const nightWKey = S.weather;
  S._bedtimeHour = S.hour;
  const nightH = 6;
  const fireAtSleep = S.fireH > 0;
  const comfort = (S.chair?1:0)+(S.table?1:0)+(S.bed?1:0);
  S._nightCtx = {nightWKey, comfort, fireAtSleep};

  if (notAtCamp){
    const foundOverhang = rand() < 0.35;
    if (foundOverhang){
      S.stress = clamp(S.stress + 6); S.morale = clamp(S.morale - 2);
      S.overhangUsed = true;
      notes.push('🪨 You find a rock overhang and tuck in out of the wind - not camp, but it holds through the night.');
    } else {
      S.stress = clamp(S.stress + 14); S.morale = clamp(S.morale - 6);
      notes.push('🌑 Night caught you away from camp. The stumble back through the dark timber does nothing for your nerves.');
    }
  }

  S.hunger = clamp(S.hunger - TUNING.depletion.hungerPerHourNight*nightH);
  S.thirst = clamp(S.thirst - TUNING.depletion.thirstPerHourNight*nightH);
  { const sleepBurn = (S.winter ? 70*1.15 : 70) * nightH; S.kcal -= sleepBurn; S.kcalBurn += sleepBurn; }
  let stokeWakeUsed = false;
  const hadFireAtStart = S.fireH > 0;
  if (!notAtCamp && S.fireH > 0){
    const used = Math.min(S.fireH, nightH);
    S.fireH = Math.max(0, S.fireH - nightH);
    S.warmth = clamp(S.warmth + 3*used, 0, S.soakedThrough ? TUNING.exposure.soakedWarmthCap : 100);
    S.wet = clamp(S.wet - 7*used);
    tickDryingAtFire(used);
    tickShiverClear(used);
    if (nightH > used){
      const rem = nightH - used;
      S.wet = clamp(S.wet - 1.5*rem);
      const dr = warmthDrainRate(false, true) * 0.55;
      S.warmth = clamp(S.warmth - dr*rem);
    }
  } else {
    S.wet = clamp(S.wet - 1.5*nightH);
    const dr = warmthDrainRate(false, true) * 0.55;
    S.warmth = clamp(S.warmth - dr*nightH);
  }
  if (phaseOf()==='P3' && hadFireAtStart && S.fireH<=0 && S.stock.firewood>=1 && rand()<0.6){
    stokeWakeUsed = true;
    S.stock.firewood--; S.fireH = 2; S.warmth = clamp(S.warmth+4); S.stress = clamp(S.stress+3);
    notes.push('🔥 You wake near 3am to the cold and feed the fire one more log before dropping back off. Broken sleep, but warmer for it. −1 firewood, +stress');
  } else if (phaseOf()!=='P1' && !hadFireAtStart){
    notes.push('🥶 No fire banked through a cold night - you feel it in your bones by morning.');
  }

  // v12 §4.3: overnight soaked/shivered-all-night penalties tripled (TUNING already carries the x3 values).
  if (S.hunger <= 1){ S.health = clamp(S.health - TUNING.depletion.overnightHealthHungerCrit); notes.push(`😖 You lay awake starving. −${TUNING.depletion.overnightHealthHungerCrit} health`); }
  else if (S.hunger < 25) notes.push('You went to bed hungry.');
  if (S.hunger < 25){
    S.hungerStreakDays = (S.hungerStreakDays||0) + 1;
    if (S.hungerStreakDays > 2) resolveDelta(-3, notes);
    if (S.hungerStreakDays === 3) maybeWriteLetter('hunger', notes);
  } else S.hungerStreakDays = 0;
  if (S.thirst <= 1){ S.health = clamp(S.health - TUNING.depletion.overnightHealthThirstCrit); notes.push(`🥵 Dehydration is setting in. −${TUNING.depletion.overnightHealthThirstCrit} health`); }
  if (S.warmth <= 1){ S.health = clamp(S.health - TUNING.depletion.overnightHealthWarmthCrit); notes.push(`🥶 You shivered violently all night. −${TUNING.depletion.overnightHealthWarmthCrit} health`); }
  else if (S.warmth < 25){ S.health = clamp(S.health - TUNING.depletion.overnightHealthWarmthLow); notes.push(`🥶 A cold, broken sleep. −${TUNING.depletion.overnightHealthWarmthLow} health`); }
  if (S.wet > 60){ S.health = clamp(S.health - TUNING.depletion.overnightHealthWet); notes.push(`💦 You slept in soaked clothes. −${TUNING.depletion.overnightHealthWet} health`); }
  if (S.sickDays > 0){ S.sickDays--; S.health = clamp(S.health - TUNING.depletion.overnightHealthSick); notes.push(`🤢 Fever and cramps from bad water. −${TUNING.depletion.overnightHealthSick} health`); }
  if (S.health < S.minHealth){
    let cause = 'the accumulated wear of the run';
    if (S.hunger <= 1) cause = 'starvation';
    else if (S.thirst <= 1) cause = 'dehydration';
    else if (S.warmth <= 1) cause = 'a night that nearly froze you out';
    else if (S.sickDays > 0) cause = 'sickness from bad water';
    else if (S.wet > 60) cause = 'a night soaked through';
    S.lowestMoment = {day:S.day, cause, health:S.health};
  }
  S.minHealth = Math.min(S.minHealth, S.health);
  if (S.health <= 0){ S.deathSource = 'collapse'; endGame('dead'); return; }

  // v12 §6.2: the break sequence - broken ankle AND any of warmth/thirst/hunger hitting 0 triggers the
  // thorough-breakdown card (queued the same way as regular cards/breakdown choices, post-night-modal).
  if (S.injury && S.injury.type === 'ankle' && S.injury.broken && !S.ankleSalvage && !S._pendingAnkleBreakCard){
    if (S.warmth <= 1 || S.thirst <= 1 || S.hunger <= 1){
      const zeroedStat = S.warmth<=1 ? 'warmth' : S.thirst<=1 ? 'thirst' : 'hunger';
      S._pendingAnkleBreakCard = zeroedStat;
    }
  }

  const activeDreadCount = ['bearDread','raiderSiege','rotStreak','wetBedding','coldSnap'].filter(k => S.conditions[k].active).length;
  if (activeDreadCount > 0) resolveDelta(-activeDreadCount * TUNING.resolve.dreadDrainPerCondition, notes);

  let dm = -2 + (S.mealsToday >= 2 ? 3 : 0) + comfort + (fireAtSleep ? 2 : 0);
  if (S.mealsToday === 0) dm -= 4;
  if (['rain','storm','snow'].includes(nightWKey)) dm -= 2;
  if (stokeWakeUsed) dm -= 3;
  if (hasTrait('brooding')) dm *= 1.25;
  dm *= sensitivityMul();
  S.morale = clamp(S.morale + dm);
  S.stress = clamp(S.stress - (4 + S.structure*2 + comfort + (fireAtSleep ? 3 : 0) - (stokeWakeUsed?3:0)));

  S._loneEnergy = 0;
  const pLone = 0.15 + (S.hunger < 40 ? 0.10 : 0) + (S.stress > 60 ? 0.05 : 0);
  if (rand() < pLone){
    const hit = Math.round((10 + Math.floor(rand()*7)) * sensitivityMul());
    S.morale = clamp(S.morale - hit);
    S._loneEnergy = 8;
    notes.push(`💭 ${pick(LONELY_LINES)} −${hit} morale, −8 energy`);
  }

  if (rand() < 0.16){
    S.stress = clamp(S.stress + 5); S.morale = clamp(S.morale - 3);
    notes.push('🐺 Wolves howl across the lake for a long time in the dark. You lie there and listen to every second of it.');
  }

  const predatorTonight = S.predatorPending;
  S.predatorPending = null;
  if (predatorTonight === 'close'){
    const walls = S.structure >= 2;
    S.stress = clamp(S.stress + (walls ? 12 : 25));
    S.morale = clamp(S.morale - 8);
    S.tot.predators++; S.predatorNearby = true;
    resolveDelta(-(8 + Math.floor(rand()*4)), notes);
    markSetback();
    if (!walls){ S.predatorFixation = true; maybeWriteLetter('terror', notes); }
    triggerBearDread();
    notes.push(walls
      ? '🐺 Close - pads and breath circling in the dark. Your solid walls hold you steady, but you sleep in fists. +stress'
      : '🐺 Something big circles the camp for an hour in the dark - you lie rigid under the tarp, knife in hand, until it moves off. It leaves on its own. ++stress');
  } else if (predatorTonight === 'tracks'){
    S.stress = clamp(S.stress + 12);
    S.predatorNearby = true;
    notes.push('🐾 Fresh tracks in the frost, circling ten meters out. Something watched you sleep. +stress');
  } else S.predatorNearby = false;

  if (phaseOf() !== 'P3' && !S.iceCache){
    const stored = meatCount() + S.smoked + (S.smokingSession?S.smokingSession.n:0) + (S.hugeSmokingSession?S.hugeSmokingSession.n:0);
    const scent = clamp(stored/30, 0, 1);
    const devastationChance = 0.004 + scent*0.012;
    if (stored > 15 && rand() < devastationChance){
      const takenAll = takeMeat(meatCount()).valueOf();
      const {got:smokedTaken} = takeSmoked(S.smoked);
      S.smokingSession = null; S.hugeSmokingSession = null;
      S.cacheTier = 0; S.cacheProg = 0; S.rackTier = 0; S.hugeRack = false;
      S.chains.grizzlyRepair = {day:S.day, cache:true, smoker:true};
      S.stress = clamp(S.stress + 40); S.morale = clamp(S.morale - 22); S.tot.predators++;
      resolveDelta(-18, notes);
      markSetback(); S.predatorFixation = true; triggerBearDread(); maybeWriteLetter('terror', notes);
      notes.push(`🐻 Wrecked. A GRIZZLY tore through camp in the night - the cache AND every smoker, all torn to nothing. ${takenAll+smokedTaken} food gone, and the wreckage will take days to rebuild.`);
    } else if (stored > 0 && rand() < 0.015 + scent*0.03){
      const cacheMult = [1.0,0.55,0.3,0.15][S.cacheTier];
      const lost = Math.min(stored, Math.round((4+rand()*10) * cacheMult + 3));
      const fromMeat = takeMeat(Math.min(lost, meatCount()));
      const fromSmoked = takeSmoked(Math.max(0, lost-fromMeat)).got;
      const taken = fromMeat + fromSmoked;
      S.stress = clamp(S.stress + 30); S.morale = clamp(S.morale - 14); S.tot.predators++;
      resolveDelta(-(12 + Math.floor(rand()*4)), notes);
      markSetback(); S.predatorFixation = true; triggerBearDread(); maybeWriteLetter('terror', notes);
      if (S.cacheTier > 0){ S.cacheTier = Math.max(0, S.cacheTier-1); notes.push(`🐻 Hit hard. A GRIZZLY hit the cache in the night - even built up, it wasn't enough. The structure is torn open and ${taken} meat is gone.`); }
      else notes.push(`🐻 Raided. A GRIZZLY worked over your stores in the dark. ${taken} meat gone, and the sound of it is going to stay with you a while.`);
    }
  }

  if (S.rackTier > 0 && S.rackTier < 2 && (meatCount()+S.smoked) > 0 && rand() < 0.025){
    S.rackTier = 0; S.stress = clamp(S.stress + 15); S.morale = clamp(S.morale - 8); S.tot.predators++;
    triggerBearDread();
    notes.push('🐻 Wrecked. A bear worked over your smoking rack in the night, hunting the smell of meat. It\'s matchwood now.');
  }
  if (S.smokingSession && rand() < 0.04){
    notes.push(`🐻 Taken. Something got into your smoking rack overnight and made off with the batch. Lost ${S.smokingSession.n} portions in progress.`);
    S.smokingSession = null;
  }
  if (S.hugeSmokingSession && rand() < 0.03){
    notes.push(`🐻 Taken. Something got into the huge rack overnight too and made off with part of that batch. Lost ${S.hugeSmokingSession.n} portions in progress.`);
    S.hugeSmokingSession = null;
  }
  if (S.insulation > 0 && rand() < 0.02){
    S.insulation = Math.max(0, S.insulation - 1);
    notes.push('🧶 A patch of moss insulation has worked itself loose overnight - needs re-stuffing.');
  }

  if (S.killSite){
    if (!S.killSite.carved){
      if (rand() < 0.30){
        queueLocNews(S.killSite.loc, `🦴 Taken. Scavengers got to the kill before you could carve it - it's gone.`);
        if (S.firstKill && S.killSite.day === S.firstKill.day && !S.threadState.vowBroken){
          S.threadState.vowBroken = true;
          resolveDelta(-6, notes);
          notes.push(`🩸 The promise you made over that first kill - gone before you even got to keep it. That sits wrong.`);
        }
        S.killSite = null; S.killSiteCarry = 0;
      }
    } else if (S.killSite.meatRemaining > 0){
      const big = GAME[S.killSite.species].tier==='big';
      if (rand() < (big?0.30:0.18)){
        const lost = Math.min(S.killSite.meatRemaining, 6+Math.floor(rand()*8));
        S.killSite.meatRemaining -= lost;
        queueLocNews(S.killSite.loc, `🦴 Raided. Scavengers found the rest of ${GAME[S.killSite.species].label} overnight. −${lost} meat left at the site.`);
        if (S.killSite.meatRemaining<=0 && S.killSiteCarry<=0) S.killSite = null;
      }
    }
  }

  S.woodsSpots.forEach(sp => {
    if (S.snareList.some(sn=>sn.spotId===sp.id) && (S.day - sp.lastCheck) >= 4 && rand() < 0.08){
      const idx = S.snareList.findIndex(sn=>sn.spotId===sp.id);
      if (idx>=0){ S.snareList.splice(idx,1); queueLocNews('woods', `🦝 Torn out. Something got to your snare at the ${sp.name} before you did - a marten or fox, by the tracks. One gone.`); }
    }
  });

  const paused = nightlyRaid(notes);
  if (paused){ S._nightNotes = notes; return; }
  finishNight(notes);
}
// v12 §2.1: the wolverine-at-the-cache template flow - the canonical multi-step night encounter, now
// routed through the card engine (CARDS.wolverineAtCache) instead of resolving in one auto roll.
export function nightlyRaid(notes?){
  const stored = meatCount() + S.smoked + (S.smokingSession?S.smokingSession.n:0) + (S.hugeSmokingSession?S.hugeSmokingSession.n:0);
  if (stored <= 0) return false;
  if (S.iceCache) return false;
  const cacheMult = [1.0,0.5,0.2,0.05][S.cacheTier];
  const campDefMult = S.campSnares ? 0.7 : 1.0;
  let chance;
  if (S.hadFirstRaid){
    chance = 0.55 * cacheMult * campDefMult; // v12 §2: some of these nights now resolve through the wolverineAtCache card instead
  } else {
    const base = stored>20 ? 0.90 : stored>12 ? 0.75 : stored>6 ? 0.50 : 0;
    if (base<=0) return false;
    chance = base * cacheMult * campDefMult;
  }
  if (rand() >= chance) return false;
  const isMarten = rand() < 0.55;
  const raiderName = isMarten ? S.martenNamed : 'a wolverine';
  const steal = Math.min(stored, isMarten ? (2+Math.floor(rand()*3)) : (4+Math.floor(rand()*6)));
  const woke = rand() < 0.25;
  if (woke && !isMarten && hasKit('bow') && S.arrows>0){
    S.pendingRaid = {steal, raiderName};
    showModal(`<h3>You wake to a sound</h3><div class="wsub">A wolverine has your stores open in the dark. Your bow is right there.</div>
      <button class="mbtn" onclick="hideModal(); resolveRaidShot(true)">Grab the bow (−1 arrow)</button>
      <button class="mbtn ghost" onclick="hideModal(); resolveRaidShot(false)">Stay still and hope</button>`);
    return true;
  }
  applyRaid(steal, raiderName, notes);
  return false;
}
export function applyRaid(steal?, raiderName?, notes?){
  const fromMeat = takeMeat(Math.min(steal, meatCount()));
  let remaining = steal - fromMeat;
  if (remaining>0){ const fromSmoked = takeSmoked(Math.min(remaining, S.smoked)).got; remaining -= fromSmoked; }
  const taken = steal - remaining;
  S.stress = clamp(S.stress + 8); S.morale = clamp(S.morale - 4);
  S.conditions.raiderSiege.active = true;
  S.conditions.raiderSiege.stacks = Math.min(3, S.conditions.raiderSiege.stacks + 1);
  S.tot.raids++; S.confessPrompt = true; markSetback();
  if (!S.hadFirstRaid){ S.hadFirstRaid = true; S.firstRaidDay = S.day; notes.push('🪤 First raid - you can set camp snares for critters now.'); }
  let woodTaken = 0;
  if (raiderName === S.martenNamed && S.stock.firewood > 0 && rand() < 0.4){
    woodTaken = Math.min(S.stock.firewood, 1 + Math.floor(rand()*2));
    S.stock.firewood -= woodTaken;
  }
  if (raiderName === S.martenNamed){
    S.martenEscalation++;
    S._promiseRaidHappened = true;
    const tactics = [
      `Raided. ${S.martenNamed} got into your stores in the dark. −${taken} meat.`,
      `Raided again. ${S.martenNamed} - bolder every time, working the cache like it's studied it. −${taken} meat.`,
      `Raided again. ${S.martenNamed} has learned your routine better than you'd like. In and out before you even stirred. −${taken} meat.`,
    ];
    const tier = Math.min(2, Math.floor(S.martenEscalation/3));
    let line = `🦡 ${tactics[tier]}`;
    if (woodTaken>0) line += ` It's dragged off ${woodTaken} piece${woodTaken>1?'s':''} of your firewood too, for good measure.`;
    if (S.day - (S.lastHumorDay||-99) >= 4 && rand() < 0.3){
      S.lastHumorDay = S.day;
      line += ' ' + pick(HUMOR_POOL);
    }
    notes.push(line);
  } else {
    notes.push(`🦡 Raided. A wolverine got into your stores in the dark. −${taken} meat.`);
  }
}
export function resolveRaidShot(shoot?){
  if (!S.pendingRaid) return;
  const {steal, raiderName} = S.pendingRaid;
  S.pendingRaid = null;
  const notes = S._nightNotes || [];
  if (shoot){
    S.arrows--;
    if (rand() < 0.55) notes.push("You've got it. An arrow into the dark - it yelps and bolts, empty-handed. Your food is safe.");
    else { notes.push('You missed. The arrow goes wide in the dark. It finishes what it started and slips off.'); applyRaid(steal, raiderName, notes); }
  } else {
    notes.push('😨 You lie still and let it finish. Easier than the alternative, some nights.');
    applyRaid(steal, raiderName, notes);
  }
  finishNight(notes);
}
export const HUMOR_POOL: any = [
  "Taking a piece of wood too, for good measure. You almost respect the thoroughness.",
  "At this point you're fairly sure it has a schedule and you're just part of its rounds.",
  "You've started leaving it slightly worse cuts of meat out of spite. It has not noticed.",
  "If it ever gets tired of thieving it's got a real future in reconnaissance.",
  "You briefly consider naming it something meaner. You don't. That would mean it won.",
  "It's developed what you can only describe as confidence. Rude, honestly.",
  "You've seen bolder men accomplish less.",
  "At some point this stopped being a raid and started being a working relationship.",
  "You'd almost put it on payroll if it would agree to leave a receipt.",
  "It has never once, not a single time, seemed embarrassed about any of this.",
];
export function finishNight(notes?){
  const ctx = S._nightCtx || {nightWKey:S.weather, comfort:0, fireAtSleep:false};
  const nightWKey = ctx.nightWKey;

  const prevMax = S.maxEnergy;
  S.mealsHistory.push(S.mealsToday);
  if (S.mealsHistory.length > 4) S.mealsHistory.shift();
  const treeMarkedYesterday = S.treeMarkedToday;
  const mealsTodayYesterday = S.mealsToday;
  const debtAtDawn = S.energyDebt;
  const intakeRatio = S.kcalBurn > 0 ? S.kcalIntake / S.kcalBurn : 1;
  S.day++;
  S.hour = ((S._bedtimeHour||22) + 6) % 24;
  S.mealsToday = 0; S.darkLogged = false; S.playedToday = false; S.restsToday = 0; S.confessedToday = false; S.sitsToday = 0;
  S.treeMarkedToday = false; S.washedToday = false;
  S.energyDebt = 0; S.kcalIntake = 0; S.kcalBurn = 0;
  S.exposureToday = 0;
  S.cardsToday = 0; S.breakdownEventsToday = 0;
  let lateRiseH = 0, lateRiseWhy = '';
  if (S.day > 4){ // compression: arrival grace halved
    if (intakeRatio < 0.6 || debtAtDawn >= 4){
      lateRiseH = clamp(debtAtDawn > 0 ? Math.round(debtAtDawn/2) : 2, 2, 3);
      lateRiseWhy = debtAtDawn >= 4 ? 'Yesterday took more than you had.' : 'You didn\'t take in enough yesterday to cover what the day cost you.';
    } else if (rand() < 0.05){
      lateRiseH = 1 + Math.floor(rand()*2);
      lateRiseWhy = 'Some mornings the body just refuses to get moving.';
    }
  }
  if (lateRiseH > 0){
    S.hour += lateRiseH;
    notes.push(`😴 You couldn't make yourself move until ${hh(S.hour)}. ${lateRiseWhy}`);
  }
  if (S.hour >= TUNING.night.hardCapHour){
    console.error(`[anti-freeze] wake hour reached ${S.hour.toFixed(3)} - clamping into the legal window.`);
    S.hour = TUNING.night.hardCapHour - 0.5;
  }
  if (!treeMarkedYesterday && (S.resolveState === 'Wavering' || S.resolveState === 'Cracking') && S.day > 2){
    notes.push('📍 You didn\'t mark the post yesterday. First time in a while. You noticed the gap more than you expected to.');
    resolveDelta(-1, notes);
  }

  S._dreamFeverFlag = S.sicknessPending > 0;
  if (S.sicknessPending > 0){
    makeSick(S.sicknessPending); S.sicknessPending = 0;
    notes.push('🤢 That bad water finally catches up with you. Your gut turns, and it isn\'t letting go soon.');
  }

  if (S.anyCatchToday) S.zeroCatchDayStreak = 0; else S.zeroCatchDayStreak = (S.zeroCatchDayStreak||0) + 1;
  S.anyCatchToday = false;
  if (S.lastKillDay !== S.day - 1 && S.lastKillDay !== S.day) S.noSignStreak = (S.noSignStreak||0) + 1; else S.noSignStreak = 0;
  if (S.noSignStreak >= TUNING.bigGame.signDroughtDays){
    S.weight = clamp(+(S.weight + TUNING.bigGame.signDroughtWeightStep).toFixed(2), 0, S.startWeight);
  }

  if (mealsTodayYesterday === 0){
    // no meals at all yesterday doesn't count toward or against the streak
  } else if (S.mealsHadOnlySmokedToday){
    S.consecutiveSmokedOnlyDays = (S.consecutiveSmokedOnlyDays||0) + 1;
    S.conditions.teeth.quietDays = 0;
  } else {
    S.consecutiveSmokedOnlyDays = 0;
  }
  S.mealsHadOnlySmokedToday = false;
  // kit-draft §3.5: salt halves the teeth-debuff advance rate.
  const teethAdvance = hasKit('salt') ? Math.floor(S.consecutiveSmokedOnlyDays/2) : S.consecutiveSmokedOnlyDays;
  if (S.consecutiveSmokedOnlyDays >= TUNING.food.monotonyDays){
    S.morale = clamp(S.morale - 2*sensitivityMul());
    S.stress = clamp(S.stress + 3*sensitivityMul());
    notes.push(`🥓 ${pick(MONOTONY_POOL)} −morale, +stress`);
  }
  {
    const prevTier = S.conditions.teeth.tier;
    if (S.mealsHadOnlySmokedToday === false && S.conditions.teeth.quietDays >= 2 && prevTier > 0){
      S.conditions.teeth.tier = Math.max(0, prevTier - 1);
      S.conditions.teeth.quietDays = 0;
      if (S.conditions.teeth.tier < prevTier) notes.push('🦷 Your teeth have had a couple of easier days - the ache is backing off.');
    } else {
      S.conditions.teeth.tier = teethTierForStreak(teethAdvance);
    }
    const tier = S.conditions.teeth.tier;
    if (tier === 2){ S.morale = clamp(S.morale - 3*sensitivityMul()); notes.push('🦷 Your teeth ache steadily now, every bite of the hard stuff a small negotiation. −morale'); }
    else if (tier >= 3){
      S.morale = clamp(S.morale - 5*sensitivityMul()); S.energy = clamp(S.energy - 6, 0, S.maxEnergy);
      notes.push('🦷 Real pain now, every time you chew. It\'s taking a bite out of the whole day. −morale, −energy');
      if (!S.chains.tooth && rand() < 0.4){
        S.chains.tooth = {day:S.day, severity:1};
        notes.push('🦷 Something finally gives - a tooth chips, sharp and sudden, right at the root.');
      }
    } else if (tier === 1 && prevTier < 1){
      notes.push('🦷 The smoked meat is starting to wear on your teeth - nothing serious yet, just a dull awareness of every bite.');
    }
  }

  if ((S.wasteDiscardToday||0) > TUNING.food.wasteEventThreshold){
    S.stress = clamp(S.stress + 12); S.morale = clamp(S.morale - 8);
    notes.push(`🗑 ${S.wasteDiscardToday} pounds of food gone bad and tossed in one day. That's real work, wasted, and it sits like a gut-punch.`);
  }
  S.wasteDiscardToday = 0;

  {
    const dKg = S.kcal / 3800; // v12 compression §4: kcal-per-kg dropped 7500 -> ~3800 to restore all body end-states under the compressed calendar
    S.weight = clamp(+(S.weight + dKg).toFixed(2), 0, S.startWeight);
    S.kcal = 0;
    const canForcePull = S.day >= TUNING.medic.noPullBeforeDay || S.health <= TUNING.medic.catastrophicHealth;
    const bmi = computeBMI();
    if (bmi <= TUNING.medic.bmiPullThreshold && canForcePull){ notes.forEach(n=>log(n,'event')); log(`⚖️ BMI ${bmi.toFixed(1)} - the weight has come off you too fast. This is the end of the run.`, 'bad'); endGame('med'); return; }
    if (weightLossPct() >= TUNING.medic.forcedPullWeightLossPct && canForcePull){ notes.forEach(n=>log(n,'event')); log('⚖️ The weight has come off you too fast. This is the end of the run.', 'bad'); endGame('med'); return; }
    else if (weightLossPct() >= 0.13 && S.day % 4 !== 1) notes.push(`⚖️ ${S.weight.toFixed(1)}kg now, down from ${S.startWeight}kg (BMI ${bmi.toFixed(1)}). The mirror in the stream is not being kind.`);
  }

  S.maxEnergy = computeMaxEnergy();
  if (debtAtDawn > 0){
    S.maxEnergy = Math.max(20, S.maxEnergy - debtAtDawn);
    notes.push(`🔋 Yesterday's borrowed energy (${roundDisplay(debtAtDawn)}) comes due - max energy trimmed to ${roundDisplay(S.maxEnergy)} today.`);
  }
  if (S.maxEnergy !== prevMax) notes.push(`⚡ ${S.maxEnergy>prevMax?'A better stretch shows - max energy has risen to':'The toll of the weeks shows - max energy has slipped to'} ${S.maxEnergy}.`);
  S.peakMax = Math.max(S.peakMax, S.maxEnergy);
  if (S.day % 2 === 0) S.forageDep = Math.max(0, S.forageDep - 1);
  S.huntPressure = Math.max(0, S.huntPressure - 2);
  S.woodsSpots.forEach(sp => { sp.pressure = Math.max(0, (sp.pressure||0) - 0.12); });
  S.shoreSpots.forEach(sp => { sp.pressure = Math.max(0, (sp.pressure||0) - 0.12); });
  if (S.net.built) S.net.pressure = Math.max(0, (S.net.pressure||0) - 0.12);
  if (S.injury && --S.injury.days <= 0 && !S.injury.broken){ notes.push(`🩹 Your ${S.injury.type} finally feels solid again.`); S.injury = null; }
  if (S.hunt.state === 'spotted' && S.hunt.day < S.day){ S.hunt = {state:'none',day:0,species:''}; notes.push('🦌 The animal you spotted has moved on in the night.'); }
  else if (S.hunt.state !== 'none' && S.hunt.day < S.day - 1){ S.hunt = {state:'none',day:0,species:''}; }

  // v12 §3.1: first frost fires on the ACTUAL first day the temp touches <=0 - no more scripted day.
  if (!S.firstFrostHit && tempFor(S.day) <= 0){
    S.weather = 'cold'; S.firstFrostHit = true; S.confessPrompt = true;
    notes.push('❄️ FIRST FROST - you wake to a world rimed in white, every surface stiff with it. The season has turned for good.');
  } else if (S.bigStormDaysLeft > 0){
    S.weather = 'storm'; S.bigStormDaysLeft--;
    notes.push(S.bigStormDaysLeft>0 ? '⛈ The Big Storm holds through a second day - no letting up.' : '⛈ The Big Storm grinds on through its last hours.');
  } else if (S.day === S.bigStormDay && !S.bigStormHit){
    S.weather = 'storm'; S.bigStormHit = true; S.bigStormDaysLeft = 1; S.confessPrompt = true;
    notes.push('⛈ THE BIG STORM - the sky finally breaks open, and it doesn\'t look like it plans to let up for a while.');
  } else {
    S.weather = rollWeather();
  }
  if (S.weather === 'storm') S.tot.storms++;
  // v12 §3.2: winter onset triggers off the first settled snowfall after the zero-cross day - snow
  // structurally cannot roll before the cross (rollWeather derives precip identity from temp).
  if (!S.winter && S.day >= S.zeroCrossDay && S.weather === 'snow'){
    S.winter = true;
    S.lineList = [];
    S._firstSnowCeremony = true;
    notes.push('❄️ Something has changed overnight - the cold isn\'t letting go again.');
  }

  S.predatorPending = rollPredatorNext();
  const stormOrFrostForeshadow = (!S.firstFrostHit && tempFor(S.day+1) <= 0) || S.day === S.bigStormDay - 1 || S.bigStormDaysLeft > 0;
  S.birdsSilent = !!S.predatorPending || stormOrFrostForeshadow;
  if (S.predatorPending && !stormOrFrostForeshadow){
    notes.push('🐦 The birds went quiet sometime this afternoon and never really started back up. Worth listening for what comes next.');
  }
  if (S.birdsSilent && hasTrait('spiritual')) S.morale = clamp(S.morale - 3);

  maybeAweEvent(notes);
  maybeSnowBeauty(notes);
  maybeDescentBeat(notes); // v12 §3.4/§8.2: post-zero temp-banded voice

  if (S.mooseLure > 0){
    const chance = 0.02 + (S.mooseLure/100)*0.05;
    if (S.hunt.state === 'none' && hasKit('bow') && rand() < chance){
      S.hunt = {state:'tracks', day:S.day, species:''};
      notes.push('📣 Somewhere in the night, something answers your calls at last - fresh tracks work their way toward the valley by morning.');
    }
    S.mooseLure = Math.max(0, S.mooseLure - 12);
  }

  let brokenTotal = 0;
  const survivors = [];
  S.snareList.forEach(sn => {
    if (rand() < 0.06) brokenTotal++;
    else survivors.push(sn);
  });
  S.snareList = survivors;
  if (brokenTotal){
    const sp = S.woodsSpots[Math.floor(rand()*S.woodsSpots.length)];
    queueLocNews('woods', `🪤 Torn out. ${brokenTotal} snare${brokenTotal>1?'s':''} chewed through overnight near the ${sp.name} - bait gone, wire kept.`);
  }

  if (nightWKey === 'storm'){
    const keep = [];
    S.lineList.forEach(ln => {
      if (rand() < (hasKit('tarp')?0.10:0.20)){ const sp=S.shoreSpots.find(s=>s.id===ln.spotId); queueLocNews('shore', `🎣 Torn loose. The storm ripped your line loose at the ${sp?sp.name:'shore'} - the wind, not a fish.`); }
      else keep.push(ln);
    });
    S.lineList = keep;
    if (S.net.built && !S.net.damaged && !S.winter && rand() < 0.06){
      S.net.built = false; S.net.spot = null; S.netProg = 0; S.netPendingSpot = null;
      queueLocNews('shore', '🕸 Gone entirely. A once-in-a-run super-storm blew through and took the gill net completely - not torn, just gone.');
    } else if (S.net.built && !S.net.damaged && !S.winter && rand() < 0.30){ S.net.damaged = true; queueLocNews('shore', '🕸 Torn. The storm tore your gill net loose - it needs repairing.'); }

    if (!S.chains.roof && S.structure >= 1 && !S.dugout && activeChainCount() < (S.day>10?2:1) && rand() < (hasKit('tarp')?0.08:0.16)){
      S.chains.roof = {day:S.day};
      notes.push('🌧 The storm rips a seam open in the roof. Wet gear, wet bedding - you\'ll need to patch it before the cold really sets in.');
    }
    if (S.smokingSession && S.rackTier < 2 && rand() < 0.35){
      notes.push(`🥓 The storm takes the rack down mid-smoke - you scramble out into it but the wind wins. Lost ${S.smokingSession.n} portions.`);
      S.smokingSession = null;
      S.rackTier = 0;
      S.stress = clamp(S.stress + 10);
    }
    const sunkCostSting = () => { if (hasTrait('stubborn')) S.morale = clamp(S.morale - 3); };
    if (!S.dugout){
      if (S.buildProg > 0 && rand() < (hasKit('tarp')?0.15:0.30)){
        S.buildProg = Math.max(0, S.buildProg - 1);
        notes.push('🏗 The storm gets into the half-built frame and undoes some of the work. A session of shelter progress lost.');
        sunkCostSting();
      }
    }
    if (S.firepitProg > 0 && rand() < 0.30){
      S.firepitProg = Math.max(0, S.firepitProg - 1);
      notes.push('⛰ Rain floods the half-set firepit before the mortar could take. Some of that work is undone.');
      sunkCostSting();
    }
    if (S.cacheProg > 0 && rand() < 0.30){
      S.cacheProg = Math.max(0, S.cacheProg - 1);
      notes.push('🗃 The unfinished cache frame takes a beating in the wind. Some of that work is undone.');
      sunkCostSting();
    }
  }
  if (S.chains.roof){
    S.wet = clamp(S.wet + 15);
    S.warmth = clamp(S.warmth - 8);
    notes.push('💧 Water dripping through the torn roof kept you damp and cold most of the night.');
  }
  if (S.chains.tooth){
    S.chains.tooth.severity = Math.min(4, S.chains.tooth.severity + 1);
    const sev = S.chains.tooth.severity;
    S.morale = clamp(S.morale - 2*sev);
    notes.push(`🦷 The cracked tooth throbs worse each day (day ${sev}). −${2*sev} morale, and it's taking a bite out of your energy until it's dealt with.`);
  }

  if (!S.winter && !S.iceCache && S.smokedBatches.length){
    const shelfH = smokedShelfHours();
    S.smokedBatches = S.smokedBatches.filter(b => {
      const ageH = (nowAbs() - b.abs);
      if (ageH >= shelfH){ notes.push(`🥓 Moldy. A batch of smoked meat has gone to mold past saving. −${b.n} smoked meat.`); return false; }
      if (ageH >= shelfH*0.6 && rand() < 0.33){
        if (!b.warned){ b.warned = true; notes.push('🥓 First mold. You notice the first fuzz starting on some of the smoked meat - use it soon.'); }
        else {
          const lost = Math.max(1, Math.floor(b.n*0.3));
          b.n -= lost;
          notes.push(`🥓 Mold claims part of an older batch. −${lost} smoked meat.`);
          if (b.n<=0) return false;
        }
      }
      return true;
    });
    S.smoked = smokedCount();
  }

  S._rivalTappedTonight = S.tapDays.length>0 && S.tapDays[0] <= S.day;
  while (S.tapDays.length && S.tapDays[0] <= S.day){
    S.tapDays.shift(); S.rivals--;
    S.morale = clamp(S.morale + 4);
    const reason = contextualTapReason();
    const name = S.tapNames.pop();
    S.rivalOrder.push({name, reason, day:S.day});
    if (SETTINGS.showRivalNews) notes.push(`📻 Base camp radio: ${name} tapped out - ${reason}. ${S.rivals} rival${S.rivals === 1 ? '' : 's'} left. (+morale)`);
    else notes.push(`📻 Base camp radio: another rival has tapped out. ${S.rivals} rival${S.rivals === 1 ? '' : 's'} left. (+morale)`);
    if (S.rivals === 2 && !S.finalTwoAnnounced){
      S.finalTwoAnnounced = true;
      notes.push('📻 Just you and one other left out here now. The radio traffic has gone quiet tonight. It feels different.');
      sfxFinalTwo();
    }
  }
  if (S.rivals <= 0){ endGame('win'); return; }

  if (!S.finalTwoAnnounced && S.morale < 35 && rand() < 0.25 && S.day - S.lastPhoneMention >= 3){
    S.lastPhoneMention = S.day;
    notes.push('📞 You catch yourself staring at the sat phone longer than you meant to.');
  }

  // compression §2: med checks every 4 days (was 7).
  if (S.day % 4 === 0){
    const canForcePull = (S.day >= TUNING.medic.noPullBeforeDay || S.health <= TUNING.medic.catastrophicHealth) && !(S.day === 4 && TUNING.medic.day7WarningOnly);
    const bmi = computeBMI();
    const severe = S.health < TUNING.medic.severeHealthThreshold || weightLossPct() >= TUNING.medic.forcedPullWeightLossPct || bmi <= TUNING.medic.bmiPullThreshold;
    const warn = S.health < 50 || weightLossPct() >= 0.12 || bmi <= TUNING.medic.bmiWarnThreshold;
    if (severe && canForcePull){ endGame('med'); return; }
    if (warn || severe){
      S.medWarnings++; S.confessPrompt = true;
      notes.push(`🩺 "How are you holding up, ${S.name}?" Day ${S.day} medical check: ${S.weight.toFixed(1)}kg, down from ${S.startWeight}kg, BMI ${bmi.toFixed(1)}. They don't love what they're seeing - a formal warning goes in the file${S.medWarnings>1?' (again)':''}.${!canForcePull?' Arrival grace still applies - nothing forced yet.':' One more like this and they pull you.'}`);
    } else {
      notes.push(`🩺 "How are you holding up, ${S.name}?" Day ${S.day} medical check: ${S.weight.toFixed(1)}kg, BMI ${bmi.toFixed(1)}. Cleared to continue.`);
    }
  }

  if (S.hunger > 60 && S.thirst > 60 && S.warmth > 60 && S.wet < 30 && S.sickDays === 0 && S.health < healthCeiling()){
    S.health = clamp(S.health + 6, 0, healthCeiling());
    notes.push('💪 Warm, fed, dry - you feel yourself recovering. +6 health');
  } else if (S.hunger > 50 && S.thirst > 50 && S.warmth > 40 && S.sickDays === 0 && S.health < healthCeiling()){
    S.health = clamp(S.health + 2, 0, healthCeiling());
    notes.push('🩹 Not comfortable, but holding together. +2 health');
  }
  S.health = Math.min(S.health, healthCeiling());

  const stableTonight = S.hunger > 50 && S.thirst > 50 && S.warmth > 40 && S.sickDays === 0 && !S.predatorNearby;
  if (stableTonight){ S.stableDayStreak = (S.stableDayStreak||0) + 1; if (S.stableDayStreak >= 2) resolveDelta(2); }
  else S.stableDayStreak = 0;

  worryLedgerDailyTick(notes);
  pruneExpiredModifiers();
  if (S.conditions.coldSnap.active) S.maxEnergy = Math.max(20, S.maxEnergy - 1);
  maybeCallbackLine(notes);
  jayDailyTick(notes);
  crowNamingTick(notes);

  medicalArcDailyTick(notes);
  maybeEnvironmentalArc(notes);

  if (S.day > 10){
    S.daysSinceConfess = (S.daysSinceConfess||0) + 1;
    if (S.daysSinceConfess >= 3){
      S.stress = clamp(S.stress + 2);
      if (S.daysSinceConfess === 3 || S.daysSinceConfess % 2 === 0){
        notes.push(pick(CAMERA_ESSENTIAL_POOL));
      }
    }
  }
  const monologue = pickDailyMonologue();
  if (monologue) notes.unshift(`<i>${monologue}</i>`);

  {
    const target = 57;
    if (S.morale > target + 3) S.morale = clamp(S.morale - 2);
    else if (S.morale < target - 3) S.morale = clamp(S.morale + 2);
  }
  enforceMoraleCeiling();

  let f = 0.7 + 0.3*(S.morale/100);
  if (S.warmth < 30) f -= 0.12;
  if (S.hunger < 20) f -= 0.12;
  if (S.thirst < 20) f -= 0.12;
  if (S.stress > 70){ f -= 0.10; S.morale = clamp(S.morale - 3); }
  if (S.sickDays > 0) f -= 0.15;
  if (S.chains.tooth) f -= 0.04*S.chains.tooth.severity;
  if (S.medicalArc && S.medicalArc.stage==='treatment') f -= 0.25;
  S.energy = Math.max(0, Math.round(S.maxEnergy * f) - (S._loneEnergy||0));
  if (hasTrait('prideful') && S.energy < 8) S.energy = 8;
  if (S.morale < 25 && rand() < 0.5){ S.energy = Math.max(0, S.energy - 8); notes.push('🌫 It is genuinely hard to see the point this morning. −8 energy'); }
  if (S.resolveState === 'Cracking' && !S.refusalUsed && rand() < 0.3){
    S.refusalUsed = true;
    S.energy = Math.max(0, S.energy - 15);
    notes.push('🚫 "I\'m not doing this today." You mean it, for a few hours - whatever gets done today, gets done late. −15 energy');
  }

  directorTick(notes);
  checkThreads(notes);
  checkAnkleSalvage(notes);
  if (S.over) return;

  checkPromise(notes);
  maybeGeneratePromise(notes);
  checkVowDeadline(notes);
  checkBreakingPoint(notes);
  if (S.forcedTapoutPending){
    notes.forEach(n => log(n, 'event'));
    showForcedTapoutCinematic();
    render();
    return;
  }

  morningEvent(notes);
  maybeResightLostAnimal(notes);
  cardSchedulerTick(notes);
  breakdownDailyTick(notes);

  const dawnLine = pickDawnLine();
  const dreamLine = pickDream();
  if (dreamLine) notes.unshift(`<i>💤 ${dreamLine}</i>`);
  if (dawnLine) notes.unshift(`<i>🗣 ${dawnLine}</i>`);

  recordDailySnapshot();
  notes.forEach(n => log(n, 'event'));
  showNightModal(notes);
  render();
}
export const MONOTONY_POOL: any = [
  "Smoked meat again. You catch yourself daydreaming about a duck stew, anything that isn't this.",
  "Chewing through another strip of the hard stuff, you'd trade a week of it for one soft plate of anything else.",
  "The texture of smoked meat has started to feel less like food and more like a chore you do with your jaw.",
];
export const CAMERA_ESSENTIAL_POOL: any = [
  "🎥 You've been carrying a few things around with nowhere to put them down. The camera's right there, if you wanted.",
  "🎥 It's been a few days since you talked to the lens. Doesn't have to be anything big. Just enough to hand it off to someone.",
  "🎥 Some of what's in your head lately doesn't have anywhere else to go. Worth saying it to the camera, even just once.",
];
export function maybeResightLostAnimal(notes?){
  if (!S.lostAnimal || S.lostAnimalResighted) return;
  if (S.day - S.lostAnimal.day < 8) return;
  if (rand() > 0.05) return;
  S.lostAnimalResighted = true;
  notes.push(`👁 Out past the tree line today - ${GAME[S.lostAnimal.species].label}, ${S.lostAnimal.detail}. Alive. It watches you a long moment, then it's gone for good this time.`);
  S.morale = clamp(S.morale + 8);
}
export const AWE_TEXT: any = {
  aurora: '✨ You step outside for a last look at the sky and the whole night is moving - green and violet light rippling overhead, silent, enormous. You stand there until your neck aches. +14 morale',
  orcas: '🐋 Black fins cut the grey water off the point at first light - a pod passing through, unhurried, close enough to hear them breathe. +14 morale',
  silence_snow: '❄️ The world after the first snow is unlike anything else - no wind, no birds, just white and your own breathing. It should feel lonely. It doesn\'t. +14 morale',
  storm_sunrise: '🌅 The storm finally breaks and the sunrise after it is obscene - gold and red split wide across a sky that was trying to kill you hours ago. +14 morale',
  starfall: '🌠 Away from any other light, the stars come down close enough to touch, and one after another they fall. You lose count. +14 morale',
  loon_calls: '🎶 A loon calls across the still water at dusk, then another answers from somewhere you can\'t see. The sound follows you all the way back to camp. +14 morale',
};
export function maybeAweEvent(notes?){
  if (S.day - S.aweLastDay < 4) return; // compression: cadence halved
  if (rand() > (hasTrait('spiritual') ? 0.6 : 0.4)) return;
  let available = Object.keys(AWE_TEXT).filter(k => !S.aweSeen.includes(k));
  available = available.filter(k => {
    if (k==='storm_sunrise') return S.bigStormHit && S.bigStormDaysLeft===0 && S.weather!=='storm';
    if (k==='silence_snow') return S.winter && S.day <= S.zeroCrossDay+3;
    return true;
  });
  if (!available.length) return;
  const key = pick(available);
  S.aweSeen.push(key); S.aweLastDay = S.day;
  S.morale = clamp(S.morale + 14);
  resolveDelta(8);
  notes.push(AWE_TEXT[key]);
  maybeWriteLetter('awe', notes);
}
export const SNOW_BEAUTY_POOL: any = [
  "❄️ The hush that comes with real snow still gets you, every time - the whole world goes quiet and soft at once.",
  "❄️ There's a particular crunch snow makes packing down under your boots that you've come to actually love, cold as it's trying to kill you.",
  "❄️ Everything out here is trying to end you right now, and it is also, somehow, the most beautiful thing you've ever lived inside.",
];
export function maybeSnowBeauty(notes?){
  if (!S.winter) return;
  if (rand() > 0.12) return;
  notes.push(pick(SNOW_BEAUTY_POOL));
}
// v12 §3.4/§8.2: post-zero-cross morning voice feels the acceleration - temp-banded pools, one beat/day max.
export const DESCENT_POOL: any = {
  band0to10: [
    "The cold has a presence to it now, some mornings - less like weather, more like something that's moved in and isn't leaving.",
    "You catch yourself doing the math on how much colder this is than yesterday, and yesterday was already bad.",
  ],
  band10to20: [
    "Ten below and the air itself feels like it has edges. You breathe through your sleeve without deciding to.",
    "Your first exhale of the morning hangs there a long time, like it doesn't want to leave either.",
  ],
  first20: [
    "Twenty below, for the first time. It gets its own kind of quiet - the whole world sounds farther away.",
  ],
};
export function maybeDescentBeat(notes?){
  if (!S.firstFrostHit) return;
  const t = tempFor(S.day);
  if (rand() > 0.35) return;
  if (t <= -20 && !S._seenFirst20){ S._seenFirst20 = true; notes.push(pick(DESCENT_POOL.first20)); return; }
  if (t <= -10) notes.push(pick(DESCENT_POOL.band10to20));
  else if (t <= 0) notes.push(pick(DESCENT_POOL.band0to10));
}
export function morningEvent(notes?){
  if (rand() > 0.5) return;
  const opts = [];
  if ((S.weather === 'rain' || S.weather === 'storm') && S.stock.firewood > 1)
    opts.push(() => { S.stock.firewood = Math.max(0, S.stock.firewood - 2); notes.push('🌧 Overnight rain soaked part of your firewood. −2 firewood'); });
  opts.push(() => { S.soundsWoods = true; notes.push('👂 Before dawn: something big crashing through the timber to the north. You could go toward the sounds… (woods)'); });
  opts.push(() => {
    const active = S.lineList.length>0 || (S.net.built && !S.winter);
    if (active) notes.push('🐟 Fish were jumping out on the water before light - worth checking your gear today.');
    else notes.push('🐟 Fish are jumping out on the water - get a line in today.');
  });
  opts.push(() => { addBerries(1); notes.push('🫐 A berry patch right behind camp. +1 berries'); });
  opts.push(() => { S.energy = clamp(S.energy + 10, 0, S.maxEnergy); notes.push('🌅 A still, beautiful morning. You feel sharp. +10 energy'); });
  opts.push(() => { S.warmth = clamp(S.warmth - 10); notes.push('🌬 A bitter wind straight off the lake. −10 warmth'); });
  opts.push(() => { S.morale = clamp(S.morale + 6); notes.push('🌄 Sunrise sets the whole lake on fire. For a minute, you remember why you came. +6 morale'); });
  opts.push(() => { S.stress = clamp(S.stress + 6); notes.push('😩 You wake stiff and sore in every joint - sleeping on the ground catches up with you. +stress'); });
  opts.push(() => { if (S.tinder>0){ S.tinder = Math.max(0,S.tinder-1); notes.push('🌧 Damp got into your tinder overnight. −1 tinder'); } else notes.push('🌫 A grey, flat morning. Nothing feels easy today.'); });
  pick(opts)();
}

