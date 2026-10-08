// Ported from legacy/tap-out-v12.html (lines 6106-6156). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { pushModifier, removeModifier } from './modifiers.ts';
import { resolveDelta } from './resolve.ts';
import { log } from './setup.ts';
import { S } from './state.ts';
import { applyTagDeltas } from './tags.ts';
import { render, showModal, typewriterInto } from './ui.ts';
// ============================== v12 §6: the break sequence (severe injury) ==============================
export function showAnkleBreakCard(){
  const stat = S._pendingAnkleBreakCard;
  S._pendingAnkleBreakCard = null;
  const statText = stat==='warmth' ? 'feel his feet' : stat==='thirst' ? 'remember his last drink' : 'remember his last full meal';
  showModal(`<h3>How the hell</h3><div class="wsub">He asks himself how the hell he keeps this up when he already can't stand right, can't ${statText}, and the ankle hasn't let up once.</div>
    <button class="mbtn" onclick="hideModal(); resolveAnkleBreak('${stat}', true)">Power through. Not like this.</button>
    <button class="mbtn ghost" onclick="hideModal(); resolveAnkleBreak('${stat}', false)">Admit it. This might be it.</button>`);
}
export function resolveAnkleBreak(stat?, choseRight?){
  if (choseRight){
    S.ankleSalvage = {stat, deadlineDay: S.day + 2};
    applyTagDeltas({hard:1,proud:1});
    pushModifier('salvageClock', '⏳ Salvage Clock', `${stat} needs to reach 35-40+ within 2 days, or the run ends.`, 'neg');
    log(`⏳ He powers through - and starts the clock. ${stat} has to come back up, and soon, or this doesn't end well.`, 'event');
  } else {
    S.deathSource = 'collapse';
    S._ankleInevitable = true;
    showInevitabilityCard(0);
  }
  render();
}
export function showInevitabilityCard(step?){
  if (step === 0){
    showModal(`<h3>The reasoning</h3><div class="wsub tw" id="twInev0" onclick="skipTypewriter('twInev0')"></div>
      <button class="mbtn" onclick="hideModal(); showInevitabilityCard(1)">Continue</button>`);
    typewriterInto('twInev0', "He does the math out loud, quietly, like it's someone else's decision he's just narrating. One leg. No fix for it out here. The rest of the body already spending down whatever it has left just to stand. There isn't a version of this that ends with him walking out on his own.", 18);
    return;
  }
  showModal(`<h3>The crumble</h3><div class="wsub tw" id="twInev1" onclick="skipTypewriter('twInev1')"></div>
    <button class="mbtn" onclick="hideModal(); endGame('tap')">Let it happen</button>`);
  typewriterInto('twInev1', "The phone's already in his hand by the time he notices it's there. He doesn't remember deciding, exactly - just watching his own thumb move like it belonged to someone more sensible than him.", 18);
}
export function checkAnkleSalvage(notes?){
  if (!S.ankleSalvage || S.over) return;
  const val = S[S.ankleSalvage.stat];
  if (val >= 35){
    removeModifier('salvageClock');
    applyTagDeltas({hard:1,humble:1,spiritual:1});
    notes.push(`⏳ Salvage met. He did the impossible on one leg - ${S.ankleSalvage.stat} back up past 35, and he's still here to notice it. Something in that is going to stay with him.`);
    resolveDelta(6, notes);
    S.ankleSalvage = null;
    return;
  }
  if (S.day >= S.ankleSalvage.deadlineDay){
    removeModifier('salvageClock');
    S.ankleSalvage = null;
    S.deathSource = 'collapse';
    notes.forEach(n=>log(n,'event'));
    showInevitabilityCard(0);
  }
}

