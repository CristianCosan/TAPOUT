// Ported from legacy/tap-out-v12.html (lines 5775-6103). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { rand } from './runtime.ts';
import { endGame } from './endings.ts';
import { addMeat, meatCount, takeMeat } from './food.ts';
import { clamp, pickNoRepeat } from './helpers.ts';
import { triggerMedicalArc } from './medical.ts';
import { pushModifier } from './modifiers.ts';
import { takeSmoked } from './person.ts';
import { resolveDelta } from './resolve.ts';
import { hasKit, log } from './setup.ts';
import { S } from './state.ts';
import { applyTagDeltas } from './tags.ts';
import { isNightNow, maybeSlip } from './threads.ts';
import { BUILD_NEED, GAME, TUNING } from './tuning.ts';
import { hideModal, render, showModal } from './ui.ts';
import { killAnimal, rememberLostAnimal } from './woods.ts';
import { triggerBearDread } from './worry.ts';
// ============================== v12 §5/§6: the card engine, expanded ==============================
export const CARDS: any = {
  wolverineAtCache: {
    id:'wolverineAtCache', weight:3, cooldown:4,
    trigger: ()=> !S.over && S.loc==='camp' && (meatCount()+S.smoked)>4,
    scene: "A wolverine has your cache open and shows no sign of leaving - low, thick-necked, entirely unbothered by your presence.",
    choices: [
      { label:'Go out and face it', tagDeltas:{bold:1}, outcomes:[{p:1.0, next:'faceRoll'}] },
      { label:'Stay in', tagDeltas:{cautious:1}, outcomes:[
        {p:0.5, text:"Verdict: it left on its own. Froze on top of the cache a moment, decided against you, and slipped off into the dark.", effects:(notes)=>{ S.stress=clamp(S.stress+6); } },
        {p:0.5, text:"Verdict: it took what it wanted. You never see it - just the sound of it working the cache, unhurried, and the morning tally that follows.", effects:(notes)=>{ const lost=Math.min(meatCount()+S.smoked, 5+Math.floor(rand()*5)); const fm=takeMeat(Math.min(lost,meatCount())); takeSmoked(Math.max(0,lost-fm)); S.stress=clamp(S.stress+10); S.morale=clamp(S.morale-6); notes.push(`−${lost} food, taken while you stayed inside.`); } },
      ]},
    ],
  },
  fox: {
    id:'fox', weight:1, cooldown:3,
    trigger: ()=> !S.over && S.hunt.state==='spotted' && S.hunt.species==='fox',
    scene: "The fox is still circling, bold, half-comic about the whole thing, clearly banking on your hesitation.",
    choices: [
      { label:'Shoo it off', tagDeltas:{tender:1}, outcomes:[{p:1.0, text:'It goes, unbothered, tail up, like it was leaving anyway.', effects:()=>{ S.hunt={state:'none',day:0,species:''}; } }] },
      { label:'Take the shot', tagDeltas:{practical:1}, outcomes:[
        {p:0.45, text:"You've got it. Small, but it's meat, and you don't feel great about how easy that was.", effects:(notes)=>{ if (S.arrows>0) S.arrows--; addMeat(3,'fox'); S.morale=clamp(S.morale-3); S.hunt={state:'none',day:0,species:''}; notes.push('+3 meat.'); } },
        {p:0.55, text:"You missed. It's already gone by the time the string clears your fingers.", effects:()=>{ if (S.arrows>0) S.arrows--; S.hunt={state:'none',day:0,species:''}; } },
      ]},
      { label:'Let him have it', tagDeltas:{tender:1,humble:1}, outcomes:[{p:1.0, text:'You toss a scrap instead and it takes it without any drama at all. Fair trade, you figure.', effects:()=>{ if (meatCount()>0) takeMeat(1); S.morale=clamp(S.morale+3); S.hunt={state:'none',day:0,species:''}; } }] },
    ],
  },
  brokenTooth: {
    id:'brokenTooth', weight:2, cooldown:10,
    trigger: ()=> !S.over && !!S.chains.tooth && S.chains.tooth.severity<=2,
    scene: "The tooth that chipped is done being background pain. It needs an actual decision now.",
    choices: [
      { label:'Pull it with the multitool', tagDeltas:{hard:1}, outcomes:[{p:1.0, text:"Agony, brief and total - and then, almost immediately, a strange relief. It's over.", effects:(notes)=>{ S.stress=clamp(S.stress+20); S.chains.tooth=null; S.morale=clamp(S.morale+6); notes.push('🦷 Pulled. Done.'); } }] },
      { label:'Poultice and endure', tagDeltas:{cautious:1}, outcomes:[{p:1.0, text:'You choose the slow way - days more of the ache instead of one bad minute.', effects:()=>{ S.morale=clamp(S.morale-3); } }] },
      { label:'Ignore it', tagDeltas:{practical:-1}, outcomes:[{p:1.0, text:"You leave it. It won't stay quiet forever.", effects:()=>{ if (rand()<0.3) triggerMedicalArc('cutInfection'); } }] },
    ],
  },
  stormPush: {
    id:'stormPush', weight:1, cooldown:6,
    trigger: ()=> !S.over && S.loc!=='camp' && S.weather==='storm',
    scene: "The storm just turned from bad to genuinely dangerous, and you're not at camp.",
    choices: [
      { label:'Push for camp', tagDeltas:{bold:1}, outcomes:[
        {p:0.6, text:'You make it, soaked and shaking, but you make it.', effects:()=>{ S.loc='camp'; S.wet=clamp(S.wet+30); S.stress=clamp(S.stress+10); } },
        {p:0.4, text:"You go down once on the way and lose time you didn't have.", effects:()=>{ S.loc='camp'; S.wet=clamp(S.wet+40); maybeSlip(true); S.stress=clamp(S.stress+16); } },
      ]},
      { label:'Shelter under deadfall', tagDeltas:{cautious:1}, outcomes:[{p:1.0, text:"You wait it out half-buried under a deadfall tangle, cold and grim but out of the worst of it.", effects:()=>{ S.wet=clamp(S.wet+15); S.warmth=clamp(S.warmth-10); } }] },
      { label:'Finish the errand first', tagDeltas:{practical:1,proud:1}, outcomes:[
        {p:0.5, text:'You get it done and still make it back, soaked but satisfied.', effects:()=>{ S.loc='camp'; S.wet=clamp(S.wet+35); S.morale=clamp(S.morale+4); } },
        {p:0.5, text:'It costs you more than the errand was worth.', effects:()=>{ S.loc='camp'; S.wet=clamp(S.wet+45); S.stress=clamp(S.stress+14); maybeSlip(true); } },
      ]},
    ],
  },
  bloodTrailDusk: {
    id:'bloodTrailDusk', weight:1, cooldown:4,
    trigger: ()=> !S.over && S.hunt.state==='trailing' && isNightNow(),
    scene: "The light's almost gone and the blood trail is still open in front of you - follow it into the dark, or lose it till morning.",
    choices: [
      { label:'Follow into the dark', tagDeltas:{bold:1}, outcomes:[
        {p:0.4, text:"You've got it - down, in the last of the light. Worth it.", effects:()=>{ killAnimal(S.hunt.species); } },
        {p:0.6, text:'You lose the trail entirely in the dark and nearly yourself along with it.', effects:()=>{ S.stress=clamp(S.stress+10); rememberLostAnimal(S.hunt.species); S.hunt={state:'none',day:0,species:''}; } },
      ]},
      { label:'Mark it and wait for dawn', tagDeltas:{cautious:1,practical:1}, outcomes:[{p:1.0, text:'You mark the last blood and walk away from it for the night. Everything in you argues against it.', effects:()=>{ S.hunt.day=S.day; S.morale=clamp(S.morale-3); } }] },
    ],
  },
  tripleTriage: {
    id:'tripleTriage', weight:1, cooldown:12,
    trigger: ()=> !S.over && S.bigStormDaysLeft===0 && S.day===(S.bigStormDay-1),
    scene: "The front's maybe three hours out and there's more to secure than there's time for. Pick one.",
    choices: [
      { label:'Reinforce the shelter', tagDeltas:{practical:1}, outcomes:[{p:1.0, text:"You brace what you can. It'll have to be enough.", effects:()=>{ S.buildProg = S.structure<3 ? Math.min(BUILD_NEED[S.structure], S.buildProg+1) : S.buildProg; } }] },
      { label:'Secure the smoker', tagDeltas:{practical:1}, outcomes:[{p:1.0, text:'You lash the rack down twice over. Whatever else happens, that batch survives.', effects:()=>{ S._smokerBraced = true; } }] },
      { label:'Pull the lines', tagDeltas:{cautious:1}, outcomes:[{p:1.0, text:'You pull everything you can before the water turns to whitecaps.', effects:()=>{ S._linesPulled = true; } }] },
    ],
  },
  limpAtCheck: {
    id:'limpAtCheck', weight:1, cooldown:12,
    trigger: ()=> !S.over && !!S.injury && S.day % 4 === 3,
    scene: "Tomorrow's the med check and you're still favoring that leg. They'll notice, if you don't hide it.",
    choices: [
      { label:'Hide it', tagDeltas:{proud:1}, outcomes:[
        {p:0.7, text:"They don't catch it. You get away clean, for now.", effects:()=>{} },
        {p:0.3, text:'They catch it anyway. A little extra scrutiny follows you now.', effects:()=>{ S.medWarnings=(S.medWarnings||0)+1; } },
      ]},
      { label:'Admit it', tagDeltas:{humble:1}, outcomes:[{p:1.0, text:'You tell them straight. It costs you a little pride and buys you a little grace.', effects:()=>{ S.morale=clamp(S.morale+3); } }] },
    ],
  },
  commitmentQuestion: {
    id:'commitmentQuestion', weight:2, cooldown:99, oncePerRun:true,
    trigger: ()=> !S.over && S.morale < 20,
    scene: "Somewhere in the middle of another bad hour, the question just arrives, unhurried and completely serious: why, exactly, are you still doing this?",
    choices: [
      { label:'For them, whoever\'s waiting', tagDeltas:{tender:1}, outcomes:[{p:1.0, text:"You answer it out loud, to nobody. It steadies you more than you expected a true thing to.", effects:(notes)=>{ S.morale=clamp(S.morale+5); resolveDelta(4,notes); } }] },
      { label:'Because quitting would be worse', tagDeltas:{hard:1,proud:1}, outcomes:[{p:1.0, text:"Not a warm answer. A true one. You'll take true.", effects:(notes)=>{ S.stress=clamp(S.stress-4); resolveDelta(3,notes); } }] },
      { label:'You honestly don\'t know anymore', tagDeltas:{humble:1}, outcomes:[{p:1.0, text:"You sit with not knowing for a while. It doesn't resolve. You get up anyway.", effects:(notes)=>{ S.morale=clamp(S.morale+1); } }] },
      { label:'Talk to the fire about it', tagDeltas:{spiritual:1}, outcomes:[{p:1.0, text:"You say it out loud to the flames like they might have an opinion. They don't. Saying it anyway helps some.", effects:(notes)=>{ S.morale=clamp(S.morale+3); resolveDelta(2,notes); } }] },
    ],
  },
  almostCantTakeIt: {
    id:'almostCantTakeIt', weight:3, cooldown:99, oncePerRun:true,
    trigger: ()=> !S.over && S.morale < 5,
    scene: "I almost can't take it anymore. Not dramatic, not a scene - just the plain, quiet, honest bottom of it, said inside your own head like a fact.",
    choices: [
      { label:'Call it. You\'ve done enough.', tagDeltas:{humble:1}, outcomes:[{p:1.0, text:"You almost mean it. Almost enough to reach for the phone. You don't, this time - but it was close, and you both know it.", effects:(notes)=>{ S.morale=clamp(S.morale+3); resolveDelta(-2,notes); } }] },
      { label:'One more day. Just one.', tagDeltas:{hard:1}, outcomes:[{p:1.0, text:"You negotiate with yourself down to the smallest unit you can survive: one more day. It's enough to get up on.", effects:(notes)=>{ resolveDelta(5,notes); S.stress=clamp(S.stress-5); } }] },
      { label:'Talk to the camera about it, honestly', tagDeltas:{tender:1}, outcomes:[{p:1.0, text:"You say the real thing to the lens for once, not the version for later. It costs something to say. It costs less once it's said.", effects:(notes)=>{ S.morale=clamp(S.morale+6); resolveDelta(4,notes); S.confessPrompt=true; } }] },
      { label:'Say nothing. Just keep moving.', tagDeltas:{practical:1}, outcomes:[{p:1.0, text:"You don't answer yourself. You just stand up and go do the next thing, which turns out to be its own kind of answer.", effects:(notes)=>{ S.stress=clamp(S.stress-3); } }] },
    ],
  },
  warningTremor: {
    id:'warningTremor', weight:2, cooldown:8,
    trigger: ()=> !S.over && S.stress > 90 && S.stress < 100,
    scene: "Your hands won't hold still. Small thing. You notice it anyway, and noticing it makes it worse.",
    choices: [
      { label:'Breathe through it, deliberately', tagDeltas:{hard:1}, outcomes:[{p:1.0, text:"You count breaths until the shake backs off. It works, mostly.", effects:(notes)=>{ S.stress=clamp(S.stress-10); } }] },
      { label:'Push through and keep working', tagDeltas:{practical:1}, outcomes:[{p:1.0, text:"You work through it, hands and all. It doesn't get better. It doesn't get worse either.", effects:()=>{} }] },
      { label:'Sit down and let it pass', tagDeltas:{tender:1}, outcomes:[{p:1.0, text:"You give it the time it's asking for instead of fighting it. It passes faster for the permission.", effects:(notes)=>{ S.stress=clamp(S.stress-6); S.morale=clamp(S.morale+2); } }] },
    ],
  },
};
export function resolveWolverineFace(){
  const inSight = rand() < 0.55;
  if (!inSight){
    log("Verdict: it ran off as you stepped out. Encounter over - small stress, a note for the morning about the cache.", 'good');
    S.stress = clamp(S.stress + 6);
    render();
    return;
  }
  const canArrow = hasKit('bow') && S.arrows > 0;
  const canKnife = hasKit('knife');
  let html = `<h3>In sight</h3><div class="wsub">It's on top of the cache, in plain sight, not backing off. Kit decides what's on the table.</div>`;
  if (canArrow) html += `<button class="mbtn" onclick="hideModal(); resolveWolverineArrow()">Aim an arrow</button>`;
  if (canKnife) html += `<button class="mbtn ${canArrow?'ghost':''}" onclick="hideModal(); resolveWolverineCharge()">Charge it with the knife</button>`;
  html += `<button class="mbtn ghost" onclick="hideModal(); resolveWolverineBackOff()">Back off</button>`;
  showModal(html);
}
export function resolveWolverineArrow(){
  S.arrows--;
  if (rand() < 0.55){
    addMeat(GAME.wolverine.meat, 'wolverine');
    S.tot.animalsKilled = (S.tot.animalsKilled||0)+1;
    S.arrows += rand()<0.6 ? 1 : 0;
    applyTagDeltas({proud:1,bold:1});
    log("Verdict: you've got it. Clean, at cache range - the arrow's probably still in it or close by. 10 meat, fatty and caloric, and several days you won't have to worry about it raiding you again. You went back to sleep excited by the rising of the dawn and the carving of the intruder.", 'good');
    S.morale = clamp(S.morale + 8);
    pushModifier('wolverineFreeNights', '🦡 Raid-free', 'That wolverine won\'t be back for a few days.', 'pos', 4);
  } else {
    log("Verdict: you missed. The arrow's gone into the dark - probably recoverable at the cache come light, but the wolverine isn't waiting around to find out.", 'bad');
  }
  render();
}
export function resolveWolverineCharge(){
  const bolts = rand() < 0.45;
  if (bolts){
    applyTagDeltas({bold:1,hard:1});
    log("Verdict: it bolts the second you close the distance - all bluff, gone into the dark. You stand there breathing hard for a minute.", 'good');
    S.stress = clamp(S.stress + 8);
  } else {
    const kill = rand() < 0.35;
    S.injury = {type:'wrist', days:5};
    S.tot.injuries++;
    S.stress = clamp(S.stress + 25);
    applyTagDeltas({hard:2});
    if (kill){
      addMeat(GAME.wolverine.meat, 'wolverine');
      S.tot.animalsKilled = (S.tot.animalsKilled||0)+1;
      log("Verdict: it doesn't run. These things are tougher than they look - it comes in and you go down together, knife-work close and ugly. You win it, but not clean: a torn forearm, a bitten hand that's going to hurt every hand-tag task for days. 10 meat on the ground and a story you won't tell straight.", 'bad');
      S.morale = clamp(S.morale + 4);
    } else {
      log("Verdict: it doesn't run, and it doesn't lose either. A torn forearm, a bitten hand, and the wolverine gone with your food anyway. That was a bad trade.", 'bad');
      S.morale = clamp(S.morale - 8);
      const lost = Math.min(meatCount()+S.smoked, 6);
      const fm = takeMeat(Math.min(lost,meatCount())); takeSmoked(Math.max(0,lost-fm));
    }
  }
  render();
}
export function resolveWolverineBackOff(){
  applyTagDeltas({cautious:1,humble:1});
  const lost = Math.min(meatCount()+S.smoked, 5+Math.floor(rand()*5));
  const fm = takeMeat(Math.min(lost,meatCount())); takeSmoked(Math.max(0,lost-fm));
  S.morale = clamp(S.morale - 6);
  log(`Verdict: you cede the night. −${lost} food, and you hate yourself for it a little. Safe is safe, though.`, 'bad');
  render();
}
export const HEYBEAR_YELL_SUCCESS_POOL: any = [
  "It breaks off unhurried, almost bored about it, and ambles back into the dark like you interrupted something minor.",
  "It takes two shouts and your voice cracks on the second one before it finally wheels off through the brush.",
  "It lingers a moment at the edge of the firelight, huffing once, before it decides you're not worth the trouble.",
  "It bolts hard and fast, and you can hear it crashing away through the timber for a long time after.",
  "It backs off a slow step at a time, never quite turning its back on you, until the dark just swallows it.",
  "It goes still a second - deciding - then turns and is gone before you've even finished the second shout.",
];
CARDS.heyBear = {
  id:'heyBear', weight:3, cooldown:5,
  trigger: ()=> !S.over && S.loc==='camp' && (meatCount()+S.smoked+(S.smokingSession?S.smokingSession.n:0)+(S.hugeSmokingSession?S.hugeSmokingSession.n:0)) > 0,
  scene: "Something's moving at the edge of the firelight, heavy and unhurried, working its way toward the smell of your stores. You know exactly what that sound is.",
  choices: [
    { label:'Stay inside', tagDeltas:{cautious:1}, outcomes:[
      {p:0.55, text:'Verdict: it took what it came for. You never see it - just hear it work the cache for five long minutes, then go quiet.', effects:(notes)=>{ const stored=meatCount()+S.smoked; const lost=Math.min(stored, 4+Math.floor(rand()*6)); const fm=takeMeat(Math.min(lost,meatCount())); takeSmoked(Math.max(0,lost-fm)); S.stress=clamp(S.stress+25); S.morale=clamp(S.morale-10); triggerBearDread(); notes.push(`🐻 −${lost} food.`); } },
      {p:0.45, text:'Verdict: it lost interest on its own. Paces, huffs once at the wall, moves on. Close enough to feel it in your chest the whole time.', effects:(notes)=>{ S.stress=clamp(S.stress+15); triggerBearDread(); } },
    ]},
    { label:'Yell HEY BEAR', tagDeltas:{bold:1}, outcomes:[
      {p:0.85, textFn: ()=>"Verdict: it works. \"HEY BEAR!\" - loud, ugly, aimed right at it. " + pickNoRepeat(HEYBEAR_YELL_SUCCESS_POOL, '_lastHeyBearLine'), effects:(notes)=>{ S.stress=clamp(S.stress+8); resolveDelta(3,notes); } },
      {p:0.15, text:"Verdict: it doesn't run. It huffs, pops its jaw, and takes one step toward the sound instead of away - and now you see the shape behind it. A mother. Cubs. This just got much worse.", effects:(notes)=>{ S.stress=clamp(S.stress+20); triggerBearDread(); notes.push('🐻 A sow with cubs. Everything about tonight just changed.'); } },
    ]},
    { label:'Go out with the mace', tagDeltas:{hard:1}, outcomes:[
      {p:0.25, text:"Verdict: it's on you before the canister clears the holster.", effects:()=>{ S.deathSource='violent'; endGame('dead'); } },
      {p:0.50, text:"Verdict: sprayed and gone. The mace catches it full in the face - it screams, bolts, doesn't look back. Your hands don't stop shaking for an hour.", effects:(notes)=>{ S.stress=clamp(S.stress+20); S.morale=clamp(S.morale+10); resolveDelta(6,notes); triggerBearDread(); notes.push('🐻 Bolted. Gone. You\'re still here.'); } },
      {p:0.25, text:"Verdict: nothing there. You stand out there, mace raised, and there's nothing - just the dark and your own heartbeat.", effects:(notes)=>{ S.stress=clamp(S.stress+10); } },
    ]},
  ],
};
// v12 §5.4: stress=100, the panic attack (never named as such) - 3-4 sequential choices, wrong choices
// deepen it (stress stays pinned, morale cost), right ones walk him down. Bespoke multi-step flow off
// the CARDS engine, same pattern as the wolverine face-roll (outcome.next dispatch in resolveCardChoice).
CARDS.panicAttack = {
  id:'panicAttack', weight:4, cooldown:6,
  trigger: ()=> !S.over && S.stress >= 100,
  scene: "Something in your chest just tipped over into somewhere worse. This isn't the tremor. This is the whole thing at once.",
  choices: [
    { label:'Ride it out', tagDeltas:{}, outcomes:[{p:1.0, next:'panicSequence'}] },
  ],
};
export function panicSteps(){
  return [
    { title:'Breathe', body:"Your chest won't open all the way, and your own pulse is loud enough to hear.",
      right:{label:'Slow it down, on purpose - four counts in, six out', text:"You force the count. It doesn't fix anything yet, but the air starts moving again."},
      wrong:{label:'Fight it - breathe faster, try to outrun it', text:"Fighting it just feeds it. The air gets thinner instead of easier."} },
    { title:'Ground', body:"The panic wants the whole world to be the panic. It isn't, yet.",
      right:{label:'Name five things you can actually touch right now', text:"Fire ring. Sleeve. Cold ground. Knife handle. Your own knee. Small, stupid, real things - and real things push back against it."},
      wrong:{label:"Squeeze your eyes shut and wait for it to pass on its own", text:"Waiting in the dark just gives it more room to work. It doesn't pass. It grows."} },
    { title:"Name what's real", body:"It's telling you things. Not all of them are true.",
      right:{label:'Say the day and the place out loud, like a fact', text:`Day ${S.day}. Still here. Saying it out loud makes it harder for the panic to argue with.`},
      wrong:{label:'Let the panic pick the next thought', text:"You let it drive for a second and it takes you somewhere much worse, fast."} },
    { title:'One thing', body:"Somewhere under all of it there's still a next single action, if you can find it.",
      right:{label:'Pick one small, doable thing and do only that', text:"Not the whole run. Not tomorrow. Just: put another log on. That's the whole job for now."},
      wrong:{label:'Freeze. Do nothing.', text:"You sit there and let it run its course with nothing to push against. It takes longer than it needed to."} },
  ];
}
export function showPanicStep(step?){
  const steps = panicSteps();
  if (step >= steps.length){
    const wentWell = (S._panicRights||0) >= 3;
    S._panicRights = 0;
    if (wentWell){
      S.stress = clamp(S.stress - 35);
      applyTagDeltas({hard:1,spiritual:1});
      log('🌊 Verdict: it breaks. Not gone - it never fully goes - but walked down to something survivable.', 'good');
    } else {
      S.stress = clamp(S.stress - 10);
      S.morale = clamp(S.morale - 8);
      applyTagDeltas({spiritual:1});
      log('🌊 Verdict: it runs its full course. You come out the other side of it, but rougher than you needed to be.', 'bad');
    }
    render();
    return;
  }
  const s = steps[step];
  showModal(`<h3>${s.title}</h3><div class="wsub">${s.body}</div>
    <button class="mbtn" onclick="hideModal(); resolvePanicChoice(${step}, true)">${s.right.label}</button>
    <button class="mbtn ghost" onclick="hideModal(); resolvePanicChoice(${step}, false)">${s.wrong.label}</button>`);
}
export function resolvePanicChoice(step?, wasRight?){
  const s = panicSteps()[step];
  const verdict = wasRight ? s.right.text : s.wrong.text;
  log(`🌊 Verdict: ${verdict}`, wasRight ? 'good' : 'bad');
  if (wasRight){ S._panicRights = (S._panicRights||0) + 1; }
  else { S.morale = clamp(S.morale - 4); }
  showPanicStep(step+1);
}
export function maybeMartenVignette(){
  log(`🐿 ${S.martenNamed} sits up on a stump nearby and watches you work for a while, unbothered, like it's got opinions about your technique.`, 'sys');
}
export function cardOnCooldown(id?){ return S.day < (S.cardCooldowns[id]||0); }
export function cardSchedulerTick(notes?){
  if (S.over) return;
  if ((S.cardsToday||0) >= TUNING.cards.maxPerDay) return;
  const eligible = Object.values(CARDS).filter(c => {
    if (S.cardsFiredOnce[c.id]) return false;
    if (cardOnCooldown(c.id)) return false;
    try { return !!c.trigger(); } catch(e){ return false; }
  });
  if (!eligible.length) return;
  if (rand() > 0.6) return;
  const totalW = eligible.reduce((a,c)=>a+c.weight,0);
  let r = rand()*totalW, chosen = eligible[0];
  for (const c of eligible){ r -= c.weight; if (r<=0){ chosen = c; break; } }
  fireCard(chosen);
}
export function fireCard(card?){
  S.cardsToday = (S.cardsToday||0) + 1;
  S.cardCooldowns[card.id] = S.day + (card.cooldown||3);
  if (card.oncePerRun) S.cardsFiredOnce[card.id] = true;
  S._pendingCard = card;
}
export function showCard(card?){
  const btns = card.choices.map((ch,i) => `<button class="mbtn ${i===0?'':'ghost'}" onclick="resolveCardChoice('${card.id}',${i})">${ch.label}</button>`).join('');
  showModal(`<h3>${card.title||''}</h3><div class="wsub">${card.scene}</div>${btns}`);
}
export function resolveCardChoice(cardId?, choiceIdx?){
  const card = CARDS[cardId];
  if (!card){ hideModal(); return; }
  const choice = card.choices[choiceIdx];
  hideModal();
  applyTagDeltas(choice.tagDeltas);
  const r = rand();
  let acc = 0, outcome = choice.outcomes[choice.outcomes.length-1];
  for (const o of choice.outcomes){ acc += o.p; if (r <= acc){ outcome = o; break; } }
  if (outcome.next === 'faceRoll'){
    S.cardHistory.push({id:card.id, day:S.day, choice:choice.label, text:'Went out to face the wolverine.'});
    resolveWolverineFace();
    return;
  }
  if (outcome.next === 'panicSequence'){
    S.cardHistory.push({id:card.id, day:S.day, choice:choice.label, text:'Talked himself down from the edge of it.'});
    S._panicRights = 0;
    showPanicStep(0);
    return;
  }
  const notes = [];
  if (outcome.effects) outcome.effects(notes);
  const resolvedText = outcome.textFn ? outcome.textFn() : outcome.text;
  S.cardHistory.push({id:card.id, day:S.day, choice:choice.label, text:resolvedText});
  if (!S.over){
    log(`🎴 ${resolvedText}`, 'event');
    notes.forEach(n=>log(n,'event'));
  }
  render();
}

