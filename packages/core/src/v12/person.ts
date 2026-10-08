// Ported from legacy/tap-out-v12.html (lines 1623-1749). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { rand } from './runtime.ts';
import { berryCount, meatCount, takeBerries, takeMeat } from './food.ts';
import { nowAbs, pick } from './helpers.ts';
import { hasTrait } from './interior.ts';
import { pushModifier } from './modifiers.ts';
import { resolveDelta } from './resolve.ts';
import { log } from './setup.ts';
import { RULES } from './rules.ts';
import { S } from './state.ts';
import { afterAction } from './threads.ts';
// ============================== v7 §5: the person layer ==============================
export function maybeCallbackLine(notes?){
  if (S.day - S.lastCallbackDay < 1) return;
  const candidates = [];
  if (S.conditions.bearDread.active && S.bearDreadDay){
    candidates.push(`🐻 ${S.day - S.bearDreadDay} day${S.day-S.bearDreadDay===1?'':'s'} since the bear. Still hear it in every snapped twig.`);
  }
  if (S.conditions.raiderSiege.active && S.firstRaidDay){
    candidates.push(`🦡 ${S.day - S.firstRaidDay} day${S.day-S.firstRaidDay===1?'':'s'} of this now - something coming back for what's yours, night after night.`);
  }
  if (S.firstKill && S.day - S.firstKill.day > 0 && S.day - S.firstKill.day <= 25){
    candidates.push(`🩸 ${S.day - S.firstKill.day} day${S.day-S.firstKill.day===1?'':'s'} since the first kill. It doesn't get lighter, just further away.`);
  }
  if (S.lostAnimal && !S.lostAnimalResighted){
    candidates.push(`👁 ${S.day - S.lostAnimal.day} day${S.day-S.lostAnimal.day===1?'':'s'} now, and you still think about the one that got away.`);
  }
  if (!candidates.length || rand() > 0.35) return;
  S.lastCallbackDay = S.day;
  notes.push(pick(candidates));
}
export const LETTER_POOL: any = {
  terror: [
    `I don't know how to tell you what that sounded like. I'm not going to try tonight. I'm still here, that's the whole letter.`,
    `Something was close enough tonight that I could hear it breathing. I thought about you the whole time it took to pass. That's not nothing.`,
    `If I don't make it back I need you to know the fear never once made me want to quit. It just made me want to see you again.`,
  ],
  awe: [
    `You would have loved this. I mean that plainly - not a performance for the camera, just a fact I wanted to hand you.`,
    `I stood out there tonight and for a minute I forgot to be afraid of anything. I wish you'd been standing next to me for it.`,
    `There are things out here I don't have words for yet. I'm saving them for when I can just show you instead.`,
  ],
  hunger: [
    `Three days now of not enough. I keep doing the math on what I'd trade for a full plate and coming up with less than I expected.`,
    `Hungry enough now that I dream about your kitchen more than I dream about home. Same thing, I guess.`,
    `I'm rationing everything, including how much I let myself think about food. It's the thinking that's hardest to ration.`,
  ],
};
export function maybeWriteLetter(trigger?, notes?){
  if (S.letters.length >= 3) return;
  if (S.letters.some(l => l.trigger === trigger)) return;
  const pool = LETTER_POOL[trigger];
  if (!pool) return;
  const text = pick(pool);
  S.letters.push({day: S.day, trigger, text});
  notes.push(`✉️ Something in you writes a letter${RULES.content && S.cast ? ` to ${S.cast.partner}` : ''} it'll never send. <span class="equote">"${text}"</span>`);
  resolveDelta(hasTrait('haunted') ? 6 : 3, notes);
}
export function crowNamingTick(notes?){
  if (S.crowNamed) return;
  if (S.ravenSeen < 3) return;
  if (rand() > 0.2) return;
  S.crowNamed = true;
  notes.push('🐦‍⬛ Same snag, third morning running. Roger. He looks like a Roger.');
}
export function jayDailyTick(notes?){
  if (S.jay.gone) return;
  const storedFood = meatCount() + S.smoked;
  if (S.jay.stage > 0){
    if (storedFood <= 0){
      S.jay.zeroFoodStreak = (S.jay.zeroFoodStreak||0) + 1;
      if (S.jay.zeroFoodStreak >= 3 && S.jay.stage < 4){
        S.jay.gone = true;
        notes.push('🐦 The gray jay hasn\'t been by in a few days now. It knows there\'s nothing here for it. You miss the company more than you expected to.');
      }
    } else S.jay.zeroFoodStreak = 0;
  }
  if (!S.jay.appeared && S.day >= 3 && rand() < 0.15){
    S.jay.appeared = true; S.jay.stage = 1;
    notes.push('🐦 A gray jay has started hanging around the edge of camp - a whiskey jack, bold-eyed, watching you work.');
  }
}
export function actFeedJay(){
  if (S.over || S.jay.stage < 1 || S.jay.stage >= 4 || S.loc !== 'camp') return;
  if (meatCount() + S.smoked + berryCount() <= 0) return;
  if (berryCount() > 0) takeBerries(1);
  else if (S.smoked > 0) takeSmoked(1);
  else takeMeat(1);
  S.jay.feeds = (S.jay.feeds||0) + 1;
  let msg;
  if (S.jay.feeds >= 8 && S.jay.stage < 4){
    S.jay.stage = 4;
    resolveDelta(5);
    pushModifier('betty', '🐦 Betty', 'The gray jay finally lands on your open hand. Small, warm, real - a good-morale modifier for the rest of the run.', 'pos');
    msg = 'It lands on your open hand this time, takes the scrap, and doesn\'t bolt right away. Something in your chest loosens - Betty, you\'ve started calling her. +resolve';
  } else if (S.jay.feeds >= 5 && S.jay.stage < 3){
    S.jay.stage = 3;
    msg = 'It\'s working the woodpile now, closer than ever, watching you as much as the food.';
  } else if (S.jay.feeds >= 2 && S.jay.stage < 2){
    S.jay.stage = 2;
    msg = 'It\'s come in to the camp edge today - closer than the treeline, for the first time.';
  } else {
    msg = 'You toss a scrap out and it drops in within the minute, quick and precise.';
  }
  log('🐦 ' + msg, 'good');
  afterAction('feedjay');
}
export function smokedCount(){ return S.smokedBatches.reduce((a,b)=>a+b.n,0); }
export function takeSmoked(n?){
  let got = 0, contaminated = false;
  while (n > 0 && S.smokedBatches.length){
    const b = S.smokedBatches[0], t = Math.min(b.n, n);
    if (b.contaminated) contaminated = true;
    b.n -= t; n -= t; got += t;
    if (b.n <= 0) S.smokedBatches.shift();
  }
  S.smoked = smokedCount();
  return {got, contaminated};
}
export function checkSmokingDone(){
  if (S.smokingSession && nowAbs() >= S.smokingSession.doneAbs){
    S.smokedBatches.push({n:S.smokingSession.n, abs:nowAbs(), warned:false, contaminated:S.smokingSession.contaminated});
    S.smoked = smokedCount();
    S.tot.smoked += S.smokingSession.n;
    log(S.smokingSession.contaminated
      ? `The rack's done - ${S.smokingSession.n} portion${S.smokingSession.n>1?'s':''} smoked through. It doesn't smell entirely right.`
      : `The rack's done - ${S.smokingSession.n} portion${S.smokingSession.n>1?'s':''} smoked through and shelf-stable, for now.`, 'good');
    S.smokingSession = null;
  }
  if (S.hugeSmokingSession && nowAbs() >= S.hugeSmokingSession.doneAbs){
    S.smokedBatches.push({n:S.hugeSmokingSession.n, abs:nowAbs(), warned:false, contaminated:S.hugeSmokingSession.contaminated});
    S.smoked = smokedCount();
    S.tot.smoked += S.hugeSmokingSession.n;
    log(S.hugeSmokingSession.contaminated
      ? `The huge rack's done - ${S.hugeSmokingSession.n} portions smoked through. It doesn't smell entirely right.`
      : `The huge rack's done - ${S.hugeSmokingSession.n} portions smoked through and shelf-stable, for now.`, 'good');
    S.hugeSmokingSession = null;
  }
}

