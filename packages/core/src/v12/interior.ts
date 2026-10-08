// Ported from legacy/tap-out-v12.html (lines 4557-4751). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { rand } from './runtime.ts';
import { ambientTempC } from './cost.ts';
import { clamp, pick } from './helpers.ts';
import { resolveDelta } from './resolve.ts';
import { S } from './state.ts';
import { GAME } from './tuning.ts';
// ============================== the interior: dawn voice + dreams ==============================
export function dawnPhase(){ return S.day<=4 ? 'early' : S.day<=10 ? 'mid' : 'late'; } // compression: phase boundaries halved
export function dawnFlags(){
  const f = new Set();
  const recentMeals = S.mealsHistory.slice(-2);
  if (recentMeals.length>=2 && recentMeals.every(m=>m<1)) f.add('hungry');
  if (S.warmth < 35) f.add('cold');
  if (S.injury) f.add('injured');
  if (S.lastKillDay === S.day-1) f.add('postKill');
  if (S._rivalTappedTonight) f.add('rivalNews');
  if (S.finalTwoAnnounced) f.add('finalTwo');
  if (S.morale >= 75) f.add('highMorale');
  if (S.morale <= 30) f.add('lowMorale');
  return f;
}
// v12 §8.1: days 1-5 are anchored to what he actually slept in - shelter-state-keyed, spread across
// the early days rather than dumped on day 1, the external build tracked alongside the internal one.
export const SHELTER_DAWN_POOL: any = [
  {id:'sd01', day:1, structure:0, text:"First night on a tarp on the bare ground, and you're still awake enough at dawn to be surprised you slept at all."},
  {id:'sd02', day:2, structure:0, text:"Second morning on the ground. Your hip has an opinion about it now."},
  {id:'sd02b', day:2, structure:1, text:"First night under the lean-to instead of the open tarp. Marginally better. You'll take marginal."},
  {id:'sd03', day:3, structure:0, text:"Creek water for breakfast and nothing else. You keep waiting for that to stop being strange."},
  {id:'sd03b', day:3, structure:1, text:"Third day, and the lean-to already feels like the difference between camping and living somewhere."},
  {id:'sd04', day:4, structure:2, text:"Waking up inside four walls for the first time - actual walls, not sticks leaned together. It changes the whole morning."},
  {id:'sd05', day:5, text:"Five days in. The quiet used to feel like a held breath. This morning it just feels like Tuesday."},
];
export function pickShelterDawnLine(){
  if (S.day > 5) return null;
  const cands = SHELTER_DAWN_POOL.filter(d => d.day === S.day && (d.structure === undefined || d.structure === S.structure));
  if (!cands.length) return null;
  const d = pick(cands);
  if (S.dawnSeen.some(x=>x.id===d.id)) return null;
  S.dawnSeen.push({id:d.id, day:S.day});
  return d.text;
}
export const DAWN_POOL: any = [
  {id:'d01', phase:'early', text:"Day two. Still feels more like an adventure than a test."},
  {id:'d02', phase:'early', text:"You catch yourself grinning at the fire for no reason. This part is almost fun."},
  {id:'d03', phase:'early', text:"The plan is simple: eat, build, outlast. How hard can simple be."},
  {id:'d04', phase:'early', text:"You set your kit out like tools on a workbench. Everything has its place. So do you, for now."},
  {id:'d05', phase:'early', text:"Cold water on your face, and for a second you forget there's a clock running at all."},
  {id:'d06', phase:'early', text:"You're not scared yet. Ask again in a week."},
  {id:'d07', phase:'early', text:"The lake looks like a postcard this morning. Try to remember that later, when it doesn't."},
  {id:'d08', phase:'early', text:"First days, still - but good nerves. The kind that keep you sharp."},
  {id:'d09', phase:'early', flag:'highMorale', text:"You wake up laughing at something from a dream you can't remember. Doesn't matter. It carries."},
  {id:'d10', phase:'early', flag:'lowMorale', text:"Already? You didn't expect the doubt to show up this soon."},
  {id:'d11', phase:'early', bs:{key:'fear',val:'dark'}, text:"You slept with one eye toward the tree line again. The dark hasn't done anything to you yet. Yet is doing a lot of work in that sentence."},
  {id:'d12', phase:'early', bs:{key:'who',val:'kid'}, text:"You picture them finding the day marked off on the fridge calendar. One square at a time."},
  {id:'d14', phase:'early', bs:{key:'fear',val:'empty'}, text:"The idea of walking back through that door with nothing to show for it is already worse, some mornings, than the cold."},
  {id:'d15', phase:'mid', text:"The routine has a shape now. Wake, work, worry, sleep. You could do it in your sleep. You basically are."},
  {id:'d16', phase:'mid', text:"Your hands don't look like your hands anymore. Rope-burned, split at the knuckles. Useful, though."},
  {id:'d17', phase:'mid', text:"You stopped counting days out loud a while back. Somewhere in there it became just weather and chores."},
  {id:'d18', phase:'mid', text:"You caught yourself narrating a task before you did it, out loud, to an empty camp."},
  {id:'d19', phase:'mid', text:"The woods stopped being scenery. Now it's just where the food is, or isn't."},
  {id:'d20', phase:'mid', text:"You know this shoreline's moods better than you know most people's."},
  {id:'d21', phase:'mid', text:"It's not misery. It's not fun either. It's just Tuesday, if Tuesday were a job with no days off."},
  {id:'d22', phase:'mid', text:"You've started rationing hope the same way you ration the meat."},
  {id:'d23', phase:'mid', flag:'hungry', text:"Your stomach woke you up before the light did. Again."},
  {id:'d24', phase:'mid', flag:'cold', text:"You dreamed about a furnace. Woke up to the same few degrees of warmth you went to sleep with."},
  {id:'d25', phase:'mid', flag:'injured', text:"Every step today is going to come with an asterisk on it."},
  {id:'d26', phase:'mid', flag:'postKill', text:"You still feel the animal's weight on your shoulders more than you feel your own this morning."},
  {id:'d27', phase:'mid', flag:'rivalNews', text:"One more name off the radio list. You didn't know them. You still felt something."},
  {id:'d28', phase:'mid', flag:'lowMorale', text:"There's a version of today where you just don't get up. You get up anyway. Small victory. It counts."},
  {id:'d29', phase:'mid', flag:'highMorale', text:"For no good reason, this morning feels like a good one. Ride it while it lasts."},
  {id:'d30', phase:'mid', bs:{key:'who',val:'partner'}, text:"You do the thing again where you talk to them like they're standing right there making coffee."},
  {id:'d31', phase:'mid', bs:{key:'who',val:'parent'}, text:"You wonder if the phone still rings at their bedside, or if they've stopped waiting for it to."},
  {id:'d32', phase:'mid', bs:{key:'who',val:'nobody'}, text:"Nobody's waiting, which was supposed to make this easier. Some mornings it just makes it quieter."},
  {id:'d33', phase:'mid', bs:{key:'fear',val:'injury'}, text:"You check your ankles before you even stand up now. Old habit, new reason."},
  {id:'d34', phase:'mid', bs:{key:'fear',val:'failing'}, text:"The fear isn't the cold anymore. It's going back and admitting the cold won."},
  {id:'d37', phase:'late', flag:'highMorale', text:"You don't flinch at the cold anymore. It just is, the way gravity just is."},
  {id:'d38', phase:'late', flag:'highMorale', text:"Whatever this place was trying to do to you, it's had its shot. You're still here, and you're not the same, and that's fine."},
  {id:'d39', phase:'late', flag:'highMorale', text:"You've started moving like someone who belongs out here. Efficient. Unbothered. Almost."},
  {id:'d40', phase:'late', flag:'lowMorale', text:"Something in you is fraying at the edge today, quietly, like a rope you keep meaning to replace."},
  {id:'d41', phase:'late', flag:'lowMorale', text:"You forgot what your own voice sounds like saying more than a sentence at a time."},
  {id:'d42', phase:'late', flag:'lowMorale', text:"You're not sure anymore if you're surviving this or just still doing it."},
  {id:'d43', phase:'late', text:"The season has a weight to it now that the first days didn't. You carry it along with everything else."},
  {id:'d44', phase:'late', text:"You've buried three versions of yourself out here already. The fourth one's still working."},
  {id:'d45', phase:'late', flag:'injured', text:"The tax on everything you do now has a name, and it's this leg, or this hand, or both."},
  {id:'d46', phase:'late', flag:'finalTwo', text:"Just you and one other left out here. It's strange how much smaller the whole map feels tonight."},
  {id:'d47', phase:'late', flag:'postKill', text:"The kill sits heavier on you than it did in the first days. You're not sure if that's growth or just exhaustion."},
  {id:'d48', phase:'late', bs:{key:'fear',val:'dark'}, text:"You don't check the tree line every ten minutes anymore. Peace, or you've just run out of the energy to be afraid."},
  {id:'d49', phase:'late', bs:{key:'who',val:'kid'}, text:"You do the math on how many bedtime stories you've missed. You stop doing that math."},
  {id:'d50', phase:'late', bs:{key:'fear',val:'empty'}, text:"The version of you that walks back with nothing has started to feel like a stranger you used to worry about."},
];
export const TRAIT_TAG_MAP: any = {
  handy: {axis:'practical', min:2}, restless: {axis:'bold', min:2}, stubborn: {axis:'hard', min:2},
  darkHumor: {axis:'practical', min:3}, prideful: {axis:'proud', min:2}, brooding: {axis:'spiritual', min:2},
  haunted: {axis:'tender', min:2}, spiritual: {axis:'spiritual', min:2},
};
export function hasTrait(t?){
  const m = TRAIT_TAG_MAP[t];
  if (!m || !S || !S.tags) return false;
  return (S.tags[m.axis]||0) >= m.min;
}
export function tagAxisValue(axis?){ return (S && S.tags && S.tags[axis]) || 0; }
export function pickDawnLine(){
  const shelterLine = pickShelterDawnLine();
  if (shelterLine) return shelterLine;
  const phase = dawnPhase(), flags = dawnFlags();
  const matches = d => (!d.phase || d.phase===phase) && (!d.flag || flags.has(d.flag)) && (!d.bs || S.backstory[d.bs.key]===d.bs.val) && (!d.trait || hasTrait(d.trait));
  let cands = DAWN_POOL.filter(matches);
  let fresh = cands.filter(d => { const s = S.dawnSeen.find(x=>x.id===d.id); return !s || (S.day - s.day) >= 5; });
  let pool = fresh.length ? fresh : cands;
  if (!pool.length) pool = DAWN_POOL.filter(d => (!d.phase||d.phase===phase) && (!d.bs || S.backstory[d.bs.key]===d.bs.val));
  if (!pool.length) pool = DAWN_POOL.filter(d => !d.phase);
  const d = pick(pool);
  S.dawnSeen.push({id:d.id, day:S.day});
  if (S.dawnSeen.length > 90) S.dawnSeen.shift();
  return d.text;
}
export const MONOLOGUE_THREADS: any = ['temp','event','stomach','mind'];
export function pickDailyMonologue(){
  const idx = (S.day + (S._monologueOffset||0)) % MONOLOGUE_THREADS.length;
  const thread = MONOLOGUE_THREADS[idx];
  if (thread === 'temp'){
    const t = ambientTempC(false);
    if (t <= -15) return `${t}°C this morning. Cold enough that it stops being weather and starts being a fact about your whole day.`;
    if (t <= 0) return `${t}°C. You can feel it settle into your hands before you've done anything at all.`;
    if (t <= 10) return `${t}°C - the kind of cold that's still just uncomfortable, not yet dangerous. Small mercy.`;
    return `${t}°C. Almost forgot what that used to feel like normal.`;
  }
  if (thread === 'event'){
    if (S.lastKillDay === S.day - 1) return `Still turning yesterday's kill over in your head - what it cost, what it bought you.`;
    if (S.tot.raids > 0 && rand()<0.4) return `${S.martenNamed} again, probably, at some point today. You've started to just expect it.`;
    return `Yesterday cost what yesterday cost. Today's its own thing.`;
  }
  if (thread === 'stomach'){
    if (S.hunger < 30) return `Your stomach's been the loudest voice in camp for a while now.`;
    if (S.consecutiveSmokedOnlyDays >= 2) return `Another day of the same hard meat. You'd trade a lot for something that isn't this.`;
    return `Not starving today, at least. Small thing. You'll take it.`;
  }
  if (S.resolveState === 'Wavering' || S.resolveState === 'Cracking') return `Your head's been doing more work than your hands lately, and it isn't the good kind of work.`;
  return `Quiet up top today, for once. You almost don't trust it.`;
}
export const DREAM_POOL: any = [
  {id:'r01', cat:'neutral', text:"A dream of nothing in particular - grey water, grey sky, a shoreline that never ends. You wake unsure if you slept at all."},
  {id:'r02', cat:'neutral', text:"You dream in a list: wood, water, wood, water. Your brain doing inventory even asleep."},
  {id:'r03', cat:'neutral', text:"A flat, dreamless kind of sleep. You wake like someone paused and un-paused you."},
  {id:'r04', cat:'neutral', text:"You dream you're back at the drop point, kit on your shoulder, about to start. The dream loops. You never actually start."},
  {id:'r05', cat:'neutral', text:"A dream of radio static in the gaps between rival updates - just noise, on and on, meaning nothing."},
  {id:'r06', cat:'neutral', text:"You dream about mending a fence. Whose fence, you couldn't say."},
  {id:'r07', cat:'neutral', text:"A dream of counting arrows in your hand, over and over, always coming up one short."},
  {id:'r08', cat:'neutral', text:"Nothing you can hold onto by morning. Just the sense you were somewhere else for a while."},
  {id:'r09', cat:'feast', text:"A cruelly specific dream: a diner breakfast, eggs over easy, toast with too much butter, coffee that never goes cold. You wake and the hunger is worse for having dreamed it."},
  {id:'r10', cat:'feast', text:"You dream of a kitchen table loaded with food you haven't thought about in years. Every dish steaming. You reach and it's gone."},
  {id:'r11', cat:'feast', text:"A dream built entirely around a burger you had once, specific bun and all. Absurd, the things a starving brain holds onto."},
  {id:'r12', cat:'feast', text:"You dream of a grocery aisle, just walking it, touching things you'd normally never buy. Waking up is the cruel part."},
  {id:'r13', cat:'feast', text:"Somewhere in the dream there's a full plate in front of you, and your hand won't move to pick up the fork."},
  {id:'r14', cat:'feast', text:"You dream of pizza, impossibly, and wake up almost angry about it."},
  {id:'r15', cat:'feast', text:"You dream you already ate. You wake up and your stomach knows better."},
  {id:'r16', cat:'home', bs:{key:'who',val:'partner'}, cost:5, text:"You dream of their hands doing something ordinary - folding laundry, maybe. You wake reaching for the other side of a bed that isn't there. −5 morale"},
  {id:'r17', cat:'home', bs:{key:'who',val:'partner'}, cost:4, text:"A good dream, actually - the two of you somewhere warm, laughing about nothing. Waking up costs more than the dream gave. −4 morale"},
  {id:'r18', cat:'home', bs:{key:'who',val:'kid'}, text:"You dream you're at an ordinary school pickup, standing at the gate. In the dream it feels completely normal. Waking up, it doesn't."},
  {id:'r19', cat:'home', bs:{key:'who',val:'kid'}, cost:5, text:"A dream of a small hand in yours, crossing a street you recognize. −5 morale"},
  {id:'r20', cat:'home', bs:{key:'who',val:'parent'}, cost:6, text:"You dream your phone rings and it's them, voice stronger than it's been in months. You wake and the silence answers instead. −6 morale"},
  {id:'r21', cat:'home', bs:{key:'who',val:'parent'}, text:"A dream of sitting at their bedside, not saying anything important. You'd take it again if you could."},
  {id:'r22', cat:'home', bs:{key:'who',val:'nobody'}, text:"You dream of an apartment that's empty in the dream too. For once, that doesn't bother you."},
  {id:'r23', cat:'home', bs:{key:'who',val:'nobody'}, text:"A dream with no people in it at all. Just woods, quieter even than this one. You wake rested, oddly."},
  {id:'r24', cat:'home', text:"You dream of a bed that isn't this one, sheets that aren't wet, a ceiling that doesn't leak."},
  {id:'r26', cat:'fever', text:"A hot, close dream - your gut in knots even asleep, a taste like pennies at the back of your throat."},
  {id:'r27', cat:'fever', text:"You dream of the stream water, over and over, and in the dream you already know not to drink it."},
  {id:'r28', cat:'fever', text:"A restless, feverish half-sleep, your body already arguing with itself before you're awake to referee it."},
  {id:'r29', cat:'fever', text:"You dream of a hand on your forehead, checking for a fever that hasn't arrived yet. It will."},
  {id:'r30', cat:'fever', text:"A dream that's mostly heat and static, like a radio tuned between stations. Your stomach already seems to know something."},
  {id:'r31', cat:'echo', cond:()=>S.lastKillDay>0 && (S.day-S.lastKillDay)<=4, text:"You dream of the animal again - the weight of it, the sound it made. You thank it a second time, just in case the first time wasn't enough."},
  {id:'r32', cat:'echo', cond:()=>!!S.lostAnimal, text:"__LOST_ANIMAL__"},
  {id:'r33', cat:'echo', cond:()=>S.tot.raids>0, text:"__MARTEN__"},
  {id:'r34', cat:'echo', cond:()=>(S.tot.deer||0)+(S.tot.moose||0)+(S.tot.beaver||0)+(S.tot.wolverine||0)>0, text:"A dream of every animal you've taken, all standing at the tree line at once, patient, unbothered, waiting for something you can't name."},
  // v12 §8.3: life-memory dreams for the early days, alongside the working food-dream pool.
  {id:'r35', cat:'life', early:true, text:"You dream of a Tuesday that meant nothing at the time - traffic, a coffee order, someone's name you can't place now. You'd give a lot to have it back exactly as boring as it was."},
  {id:'r36', cat:'life', early:true, text:"A dream of your own hands doing something you haven't done in years - a job you had once, a skill nobody out here needs."},
  {id:'r37', cat:'life', early:true, text:"You dream of a hallway from a house you lived in as a kid, walking it slow, touching the walls like you're checking they're real."},
  {id:'r38', cat:'life', early:true, text:"A dream of a voice you know reading something out loud, and you can't quite make out the words, only the shape of the sound."},
];
export function pickDream(){
  const feverActive = S._dreamFeverFlag;
  const earlyOk = S.day <= 5;
  const cands = DREAM_POOL.filter(d=>{
    if (d.cat==='fever' && !feverActive) return false;
    if (d.cat==='life' && !earlyOk) return false;
    if (d.cond && !d.cond()) return false;
    if (d.bs && S.backstory[d.bs.key] !== d.bs.val) return false;
    return true;
  });
  if (!cands.length) return null;
  const fresh = cands.filter(d => { const s = S.dreamsSeen.find(x=>x.id===d.id); return !s || (S.day - s.day) >= 3; });
  const pool = fresh.length ? fresh : cands;
  const d = pick(pool);
  S.dreamsSeen.push({id:d.id, day:S.day});
  if (S.dreamsSeen.length > 60) S.dreamsSeen.shift();
  let text = d.text;
  if (text === '__LOST_ANIMAL__' && S.lostAnimal) text = `The one that got away finds you in your sleep - ${GAME[S.lostAnimal.species].label}, ${S.lostAnimal.detail}. It looks at you like it's still deciding something.`;
  if (text === '__MARTEN__') text = `You dream of ${S.martenNamed}, bold as anything, walking right into camp in broad daylight and taking whatever it wants without even hurrying.`;
  if (d.cost){ const mul = hasTrait('haunted') ? 1.6 : 1; S.morale = clamp(S.morale - d.cost*mul); resolveDelta(-2*mul); }
  return text;
}

