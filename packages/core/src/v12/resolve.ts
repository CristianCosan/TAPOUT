// Ported from legacy/tap-out-v12.html (lines 1982-2053). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { rand } from './runtime.ts';
import { meatCount } from './food.ts';
import { clamp, pick } from './helpers.ts';
import { hasTrait } from './interior.ts';
import { sensitivityMul } from './setup.ts';
import { S } from './state.ts';
// ============================== v6.2: resolve - the will to stay ==============================
export function resolveStateOf(v?){
  if (v >= 60) return 'Steady';
  if (v >= 35) return 'Wavering';
  if (v >= 15) return 'Cracking';
  return 'Breaking';
}
export function resolveDelta(n?, notes?){
  if (!S || S.resolve === undefined) return;
  const prevState = resolveStateOf(S.resolve);
  if (n < 0){
    n *= sensitivityMul();
    if (hasTrait('stubborn') && prevState !== 'Steady') n *= 0.8;
    if (hasTrait('darkHumor')){ const masked = n * 0.3; n *= 0.7; S.morale = clamp(S.morale + masked*0.5); }
    if (hasTrait('prideful')) n *= 1.5;
  }
  S.resolve = clamp(S.resolve + n, 0, S.resolveCap);
  const newState = resolveStateOf(S.resolve);
  S.resolveState = newState;
  if (newState === 'Cracking' && prevState !== 'Cracking' && prevState !== 'Breaking'){
    S.resolveCracks++;
    S.resolveCap = Math.max(40, S.resolveCap - 5);
    S.resolve = Math.min(S.resolve, S.resolveCap);
    if (notes) notes.push('💭 Something in you has started to crack at the edges. It doesn\'t feel like it\'s going to fully mend, either.');
  }
}
export function maybeGeneratePromise(notes?){
  if (S.promise || S.over) return;
  if (S.resolveState !== 'Wavering' && S.resolveState !== 'Cracking') return;
  if (rand() > 0.35) return;
  const options = [];
  if (S.hadFirstRaid) options.push({key:'marten', text:`If ${S.martenNamed} takes anything else out of my stores, I swear-`, deadline:S.day+2, checkType:'raid'});
  options.push({key:'meatless', text:`If I'm still meatless by day ${S.day+2}, that's it.`, deadline:S.day+2, checkType:'meatless'});
  options.push({key:'soaked', text:`One more night soaked through like this and I'm done.`, deadline:S.day+1, checkType:'soaked'});
  if (!options.length) return;
  S.promise = pick(options);
  S.promiseWarningsGiven = (S.promiseWarningsGiven||0) + 1;
  S.confessPrompt = true;
  notes.push(`💭 "${S.promise.text}"`);
}
export function checkPromise(notes?){
  if (!S.promise) return;
  let broken = false;
  if (S.promise.checkType === 'raid' && S._promiseRaidHappened) broken = true;
  else if (S.promise.checkType === 'meatless' && S.day >= S.promise.deadline && (meatCount()+S.smoked) <= 0) broken = true;
  else if (S.promise.checkType === 'soaked' && S.day >= S.promise.deadline && S.wet > 60) broken = true;
  if (broken){
    resolveDelta(-(10 + Math.floor(rand()*11)), notes);
    S.promisesFired.push({...S.promise, day:S.day, kept:false});
    notes.push(`💔 You didn't hold to it. "${S.promise.text}" - and here you are anyway.`);
    S.promise = null;
  } else if (S.day > S.promise.deadline){
    resolveDelta(5, notes);
    S.promisesFired.push({...S.promise, day:S.day, kept:true});
    notes.push('🤝 You held the line on that one, at least.');
    S.promise = null;
  }
  S._promiseRaidHappened = false;
}
export function checkBreakingPoint(notes?){
  if (S.resolve > 0 || S.over) return;
  if (!S.adrenalineUsed && S.health > 50){
    S.adrenalineUsed = true;
    S.resolve = 20; S.resolveState = resolveStateOf(20);
    notes.push('🔥 Something in you refuses. "Not like this. Not today." You don\'t know where it came from, but it\'s enough, for now.');
    return;
  }
  if ((S.promiseWarningsGiven||0) < 2){
    S.resolve = 5; S.resolveState = resolveStateOf(5);
    return;
  }
  S.forcedTapoutPending = true;
}

