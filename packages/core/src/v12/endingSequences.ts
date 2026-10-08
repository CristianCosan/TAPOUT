// Ported from legacy/tap-out-v12.html (lines 6159-6264). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { WHO_LABEL } from './camp.ts';
import { S } from './state.ts';
import { showModal, typewriterInto } from './ui.ts';
// ============================== v12 §7: ending sequences for ALL endings ==============================
export function startEndingSequence(kind?){
  S.endingChoices = S.endingChoices || {};
  if (kind === 'dead'){
    if (!S.deathSource) S.deathSource = 'collapse';
    if (S.deathSource === 'violent') showViolentDeathStep1(); else showCollapseStep1();
    return;
  }
  if (kind === 'win') showWinStep1(); else showLossStep1(kind);
}
export function showCollapseStep1(){
  const causeLine = S.lowestMoment ? S.lowestMoment.cause : 'the accumulated wear of the run';
  showModal(`<h3>The last stretch</h3><div class="wsub tw" id="twC1" onclick="skipTypewriter('twC1')"></div>
    <button class="mbtn" onclick="hideModal(); showCollapseStep2()">Continue</button>`);
  typewriterInto('twC1', `Consciousness comes and goes in pieces now. ${causeLine.charAt(0).toUpperCase()+causeLine.slice(1)}, mostly - the body running out of ways to argue with it. There isn't a clean thought left, just the crawl toward the one thing that still makes sense: the phone, or the fire, or just staying still until someone comes.`, 16);
}
export function showCollapseStep2(){
  showModal(`<h3>The last of it</h3><div class="wsub tw" id="twC2" onclick="skipTypewriter('twC2')"></div>
    <button class="mbtn" onclick="hideModal(); showCollapseFade()">Continue</button>`);
  typewriterInto('twC2', S.forcedTapout || S.medicalArc ? "Someone else's hands are doing the deciding now, mostly - the call already made, the beacon already going, the last of it just holding on long enough for it to matter." : "The last clear thing is the cold, or maybe it stopped being cold a while ago and became something else entirely. Either way, it's the last thing.", 16);
}
export function showCollapseFade(){
  showModal(`<h3>—</h3><div class="wsub tw" id="twCFade" onclick="skipTypewriter('twCFade')"></div><button class="mbtn" onclick="hideModal(); showCollapseAftermath()">Continue</button>`);
  typewriterInto('twCFade', "Nothing, for a while. Just a gap where the next thought should be.", 14);
}
export function showCollapseAftermath(){
  const who = WHO_LABEL[S.backstory.who] || 'no one in particular';
  showModal(`<h3>Waking up</h3><div class="wsub tw" id="twCAft" onclick="skipTypewriter('twCAft')"></div><button class="mbtn" onclick="hideModal(); showFinalStatsScreen('dead')">Continue</button>`);
  typewriterInto('twCAft', `They got to him eventually. A hospital ceiling, too bright, a voice asking his name like it's a test he might fail. He's alive - that's the whole headline. Somewhere, ${who} gets the call that isn't the bad kind, and it takes a while for that to feel real to anyone, including him.`, 16);
}
export function showViolentDeathStep1(){
  showModal(`<h3>—</h3><div class="wsub tw" id="twV1" onclick="skipTypewriter('twV1')"></div><button class="mbtn" onclick="hideModal(); showViolentDeathStep2()">Continue</button>`);
  typewriterInto('twV1', "Fast, and sensory, and over before it finishes registering. White, then nothing.", 16);
}
export function showViolentDeathStep2(){
  showModal(`<h3>—</h3><div class="wsub tw" id="twV2" onclick="skipTypewriter('twV2')"></div><button class="mbtn" onclick="hideModal(); showViolentDeathStep3()">Continue</button>`);
  typewriterInto('twV2', "And it stays nothing.", 20);
}
export function showViolentDeathStep3(){
  showModal(`<h3>Days later</h3><div class="wsub tw" id="twV3" onclick="skipTypewriter('twV3')"></div><button class="mbtn" onclick="hideModal(); showFinalStatsScreen('dead')">Continue</button>`);
  typewriterInto('twV3', `The med-check boat eases in on schedule, same as every few days. The fire is long cold. Camp is arranged exactly as he left it - the tally tree with its marks, the shelter, everything in its place except him. It takes them a while to understand what they're looking at.`, 16);
}
export function showLossStep1(kind?){
  const text = "You touch the tally tree on your way past - more marks on it than you remembered cutting. Betty's snag is empty this morning, first time in a while. Your arrows are still in the quiver, unused, the way they'll stay now. There's an antler by the fire pit you never quite got around to doing anything with. It'll stay there.";
  showModal(`<h3>The Morning After the Call</h3><div class="wsub tw" id="twL1" onclick="skipTypewriter('twL1')"></div><button class="mbtn" onclick="hideModal(); showLossPhoneCall('${kind}')">Continue</button>`);
  typewriterInto('twL1', text, 18);
}
export function showLossPhoneCall(kind?){
  const salvageLine = S.ankleSalvage===null && S._ankleInevitable ? " He'd fought the ankle as long as the clock gave him." : '';
  const vowLine = S.vow ? ` A vow he never quite settled, still hanging over the line as he dials.` : '';
  const text = kind === 'med'
    ? `The decision was made for him, mostly - but he still has to hold the phone while they confirm it, still has to hear his own voice agree.${salvageLine} "Yeah," he says, when they ask if he understands. "Yeah, I understand."`
    : `The antenna's already up before he's fully decided. It rings twice.${vowLine} He says less than he expected to. Something like "I'm done. Come get me." Something like relief, arriving early.`;
  showModal(`<h3>The Call</h3><div class="wsub tw" id="twLCall" onclick="skipTypewriter('twLCall')"></div><button class="mbtn" onclick="hideModal(); showLossStep2('${kind}')">Continue</button>`);
  typewriterInto('twLCall', text, 16);
}
export function showLossStep2(kind?){
  showModal(`<h3>The Motor</h3><div class="wsub">You can hear it before you can see it.</div>
    <button class="mbtn" onclick="hideModal(); showLossStep3('${kind}')">Wait at the shore</button>
    <button class="mbtn ghost" onclick="hideModal(); showLossStep3('${kind}')">Walk the trapline one last time first</button>`);
}
export function showLossStep3(kind?){
  const opts = ['The cold.','My body made the choice.',"Someone's waiting on me.","The quiet. I couldn't carry it.",'(say nothing)'];
  const btns = opts.map(o=>`<button class="mbtn ghost" onclick="hideModal(); recordWhy('${o.replace(/'/g,"\\'")}'); showLossStep4('${kind}')">${o}</button>`).join('');
  showModal(`<h3>"Why?"</h3><div class="wsub">Someone's going to ask, eventually. You decide the answer now, while it's still just yours.</div>${btns}`);
}
export function recordWhy(text?){ S.endingChoices.why = text === '(say nothing)' ? null : text; }
export function showLossStep4(kind?){
  const opts = ['the shelter','the water','the treeline','the tally tree',"Betty's snag"];
  const btns = opts.map(o=>`<button class="mbtn ghost" onclick="hideModal(); recordLastLook('${o}'); showLossStep5('${kind}')">${o}</button>`).join('');
  showModal(`<h3>The Last Look</h3><div class="wsub">One last thing to look at before you go.</div>${btns}`);
}
export function recordLastLook(text?){ S.endingChoices.lastLook = text; }
export function showLossStep5(kind?){
  const vehicle = (S.warmth<=15 || S.health<=15) ? 'helicopter' : 'boat';
  const rivalNote = S.rivals>0 ? ` Somewhere out there, ${S.rivals} other fire${S.rivals===1?' is':'s are'} still going.` : '';
  const text = `The ${vehicle} pulls you off the shoreline and the whole run goes small behind you fast, faster than the days it took to live it.${rivalNote}`;
  showModal(`<h3>Pulling Away</h3><div class="wsub tw" id="twL5" onclick="skipTypewriter('twL5')"></div><button class="mbtn" onclick="hideModal(); showFinalStatsScreen('${kind}')">Continue</button>`);
  typewriterInto('twL5', text, 18);
}
export function showWinStep1(){
  const text = "It reads like just another med check at first - the boat easing in, someone stepping off with a clipboard. Then you notice nobody else is with them. You learn it the way you've learned everything else out here: quietly, without a countdown. You're the last one.";
  showModal(`<h3>A Motor, Unannounced</h3><div class="wsub tw" id="twW1" onclick="skipTypewriter('twW1')"></div><button class="mbtn" onclick="hideModal(); showWinStep2()">Continue</button>`);
  typewriterInto('twW1', text, 18);
}
export function showWinStep2(){
  const who = WHO_LABEL[S.backstory.who] || 'anyone, really';
  const text = S.backstory.who === 'nobody'
    ? "Nobody's waiting on the dock. Someone from the crew walks up anyway and just says your name, and it turns out that's enough."
    : `${who.charAt(0).toUpperCase()+who.slice(1)} steps off first, before the boat's even fully in, and you're moving before you've decided to.`;
  showModal(`<h3>The Arrival</h3><div class="wsub tw" id="twW2" onclick="skipTypewriter('twW2')"></div><button class="mbtn" onclick="hideModal(); showWinStep3()">Continue</button>`);
  typewriterInto('twW2', text, 18);
}
export function showWinStep3(){
  const opts = ['the shelter','the smoker','the tally tree','Betty'];
  const btns = opts.map(o=>`<button class="mbtn ghost" onclick="hideModal(); recordLastLook('${o}'); showWinStep4()">${o}</button>`).join('');
  showModal(`<h3>Showing Them</h3><div class="wsub">There's a version of a tour in you, apparently. What do you show them first?</div>${btns}`);
}
export function showWinStep4(){
  showModal(`<h3>The Last Look</h3><div class="wsub">One last look at the place before the boat.</div>
    <button class="mbtn" onclick="hideModal(); showWinStep5()">Take it</button>`);
}
export function showWinStep5(){
  const text = "The coastline goes dark behind you as the boat pulls out, and somewhere out there nine other fires have already gone cold. Every one of them home, one way or another. You're the last light still burning, and now you're not even that.";
  showModal(`<h3>Leaving</h3><div class="wsub tw" id="twW5" onclick="skipTypewriter('twW5')"></div><button class="mbtn" onclick="hideModal(); showFinalStatsScreen('win')">Continue</button>`);
  typewriterInto('twW5', text, 18);
}

