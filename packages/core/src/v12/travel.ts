// Ported from legacy/tap-out-v12.html (lines 2311-2441). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { rand } from './runtime.ts';
import { actBootFailure } from './camp.ts';
import { maybeMartenVignette } from './cards.ts';
import { meatCount } from './food.ts';
import { TRAVEL_HOURS, clamp, duskHour, pick } from './helpers.ts';
import { hasTrait } from './interior.ts';
import { triggerMedicalArc } from './medical.ts';
import { applyRaid } from './night.ts';
import { curfewCapForLoc, hasKit, log } from './setup.ts';
import { S } from './state.ts';
import { afterAction, spend } from './threads.ts';
import { SIGNS_SHORE, SIGNS_WOODS, TUNING, sensoryLine } from './tuning.ts';
import { showModal } from './ui.ts';
// ============================== travel & signs ==============================
export function ambientFlavor(loc?){
  const sensed = sensoryLine(loc);
  if (sensed) return sensed;
  if (loc === 'woods') return pick(SIGNS_WOODS);
  if (loc === 'shore') return pick(SIGNS_SHORE);
  return 'The fire ring, the shelter, everything you have.';
}
// v12 §1.4: snare/line/net digest news states the event AND its cause, not just the resulting state.
export function travelPopup(loc?){
  const firstVisitToday = S.lastVisited[loc] !== S.day;
  const lines = [ambientFlavor(loc)];
  const elapsed = S.day - (S.lastVisited[loc] || S.day);
  if (elapsed >= 2) lines.push(`🕒 First time back here in ${elapsed} days.`);
  S.lastVisited[loc] = S.day;
  if (S.pendingLocNews && S.pendingLocNews[loc] && S.pendingLocNews[loc].length){
    lines.push(...S.pendingLocNews[loc]);
    S.pendingLocNews[loc] = [];
  }
  if (loc === 'woods'){
    const staleSnares = S.snareList.filter(sn => (S.day - sn.lastCheck) >= 2).length;
    if (staleSnares > 0) lines.push(`🪤 ${staleSnares} snare${staleSnares>1?'s':''} out here ${staleSnares>1?"haven't":"hasn't"} been checked in a while.`);
  }
  if (loc === 'shore'){
    const staleLines = S.lineList.filter(ln => (S.day - ln.lastCheck) >= 2).length;
    if (staleLines > 0) lines.push(`🎣 ${staleLines} line${staleLines>1?'s':''} out here ${staleLines>1?"haven't":"hasn't"} been checked in a while.`);
    if (S.net.built && (S.day - S.net.lastCheck) >= 2) lines.push('🕸 The net hasn\'t been pulled in a while either.');
  }
  if (loc === 'woods'){
    const activeIds = new Set(S.snareList.map(sn=>sn.spotId));
    const activeSpots = S.woodsSpots.filter(sp=>activeIds.has(sp.id));
    if (activeSpots.length){
      const bestQ = Math.max(...activeSpots.map(s=>s.q));
      const truth = rand() < Math.min(0.8, bestQ*1.8);
      const shown = rand() < (hasTrait('brooding') ? 0.85 : 0.7) ? truth : !truth;
      lines.push(shown ? "🪤 Something's hanging at one of the snares - or what's left of one." : '🪤 The trapline looks quiet from here - probably nothing, but hard to say for sure.');
    }
  }
  if (loc === 'shore'){
    const activeIds = new Set(S.lineList.map(ln=>ln.spotId));
    const activeSpots = S.shoreSpots.filter(sp=>activeIds.has(sp.id));
    const netActive = S.net.built && !S.net.damaged && !S.winter;
    if (activeSpots.length || netActive){
      const qs = activeSpots.map(s=>s.q).concat(netActive ? [(S.shoreSpots.find(s=>s.id===S.net.spot)||{q:0.2}).q] : []);
      const bestQ = Math.max(...qs, 0);
      const truth = rand() < Math.min(0.8, bestQ*1.8);
      const shown = rand() < (hasTrait('brooding') ? 0.85 : 0.7) ? truth : !truth;
      lines.push(shown ? "🎣 There's a pull on one of the lines out there - something's on, or was." : '🎣 The water looks still - probably nothing on the hooks.');
    }
  }
  if ((loc === 'woods' || loc === 'shore') && S.hunt.state === 'none' && hasKit('bow') && rand() < (loc === 'woods' ? 0.14 : 0.06)){
    const animal = pick(['deer','moose','something big - hard to tell']);
    const dir = pick(['toward the ridge','along the creek','up past the old burn','toward the beaver meadow','down the shoreline']);
    S.hunt = {state:'tracks', day:S.day, species:''};
    lines.push(`🐾 Fresh tracks - ${animal}, heading ${dir}. Worth following, or setting a snare that way.`);
  }
  if ((loc === 'woods' || loc === 'shore') && S.hunt.state === 'none' && hasKit('bow')){
    if (loc === 'shore' && rand() < 0.12){
      S.hunt = {state:'spotted', day:S.day, species:'duck', small:true};
      lines.push('🦆 A duck sits close in on the water, unbothered. Worth a quick shot.');
    } else if (rand() < 0.08){
      S.hunt = {state:'spotted', day:S.day, species: rand()<0.2 ? 'fatGrouse' : 'grouse', small:true};
      lines.push('🐦 A grouse freezes mid-step a few yards off, trusting its stillness. Worth a quick shot.');
    } else if (rand() < 0.10){
      S.hunt = {state:'spotted', day:S.day, species:'squirrel', small:true};
      lines.push('🐿 A squirrel sits up on a low branch, close enough. Worth a quick shot.');
    }
  }
  if (rand() < 0.07){
    S.ravenSeen++;
    const ravenLines = [
      '🐦‍⬛ The raven again - it\'s been shadowing you between camp and here for days now. Omen or company, hard to say.',
      '🐦‍⬛ That same raven drops onto a branch just ahead of you and watches you pass, unbothered, like it\'s keeping tabs.',
      '🐦‍⬛ The raven croaks once from somewhere overhead, then goes quiet. You\'ve started to find it almost reassuring.',
    ];
    lines.push(pick(ravenLines));
  }
  if (rand() < 0.03) maybeMartenVignette();
  S.signs[loc] = lines[0];
  if (firstVisitToday) showModal(`<h3>${loc==='camp'?'Back at camp':'At the '+loc}</h3><ul>${lines.map(l=>`<li>${l}</li>`).join('')}</ul><button class="mbtn" onclick="hideModal()">Continue</button>`);
}
export function goTo(loc?){
  if (S.over || loc === S.loc) return;
  const cap = curfewCapForLoc(loc);
  let trvH = S.winter ? TRAVEL_HOURS : TRAVEL_HOURS/2;
  if (S.winter) trvH *= TUNING.postSnow.travelTimeMultiplier;
  if (S.injury && S.injury.type === 'ankle') trvH *= TUNING.ankle.travelMul / (S.winter?1.5:1); // ankle multiplier owns this now (§6.1), replacing the old flat x4
  if (!spend(S.winter?5:3, trvH, true, 'ot', cap)) return;
  if (loc === 'shore' && !S.medicalArc && (S.weather==='rain'||S.weather==='storm') && rand() < 0.03){
    triggerMedicalArc('brokenAnkle');
  }
  S.loc = loc;
  if (loc !== 'camp' && S.hadFirstRaid && !S.iceCache){
    const stored = meatCount() + S.smoked + (S.smokingSession?S.smokingSession.n:0) + (S.hugeSmokingSession?S.hugeSmokingSession.n:0);
    if (stored > 0){
      const cacheMult = [1.0,0.5,0.2,0.05][S.cacheTier];
      if (rand() < 0.10 * cacheMult){
        const isMarten = rand() < 0.6;
        const raiderName = isMarten ? S.martenNamed : 'a wolverine';
        const steal = Math.min(stored, isMarten ? (1+Math.floor(rand()*3)) : (2+Math.floor(rand()*4)));
        const dayNotes = [];
        applyRaid(steal, raiderName, dayNotes);
        dayNotes.forEach(n => log(n.replace('in the dark','while you were out').replace('in the night','while you were away'), 'bad'));
      }
    }
  }
  if (loc === 'camp' && S.hour >= duskHour()-2){
    S.stress = clamp(S.stress + 8);
    log('Stumbling back to camp in the pitch dark is its own kind of miserable.', 'bad');
  }
  if (rand() < 0.04){
    S.stress = clamp(S.stress + 4);
    log('You stumble on uneven ground and swear under your breath. Nothing serious, but it rattles you. +stress', 'bad');
  }
  S.gear.boots = Math.max(0, S.gear.boots - 0.6);
  if (S.gear.boots <= 0 && !S.chains.boot) actBootFailure();
  else if (S.chains.boot){
    S.warmth = clamp(S.warmth - 4);
    if (rand() < 0.05){
      S.health = clamp(S.health - 6); S.stress = clamp(S.stress + 6);
      log('Your feet have gone numb and white at the toes - frostbite creeping in. −6 health', 'bad');
    }
  }
  log(`You make your way to the ${loc === 'camp' ? 'camp' : loc}.`, 'sys');
  travelPopup(loc);
  afterAction('travel');
}
export function queueLocNews(loc?, msg?){
  if (loc !== 'woods' && loc !== 'shore') return;
  S.pendingLocNews = S.pendingLocNews || {woods:[], shore:[]};
  S.pendingLocNews[loc].push(msg);
}

