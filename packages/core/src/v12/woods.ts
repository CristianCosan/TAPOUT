// Ported from legacy/tap-out-v12.html (lines 2444-2868). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { rand } from './runtime.ts';
import { actAxeHandleBreak } from './camp.ts';
import { ambientTempC } from './cost.ts';
import { addBerries, addMeat, spoilageSting } from './food.ts';
import { clamp, nowAbs, pick } from './helpers.ts';
import { hasTrait } from './interior.ts';
import { resolveDelta } from './resolve.ts';
import { consumeKitStock, hasKit, log, maybeRenameSpot, registerEmptyCheck } from './setup.ts';
import { S } from './state.ts';
import { afterAction, isNightNow, spend } from './threads.ts';
import { CARRY_CAP, GAME, HUGE_RACK_CAP, MAX_SNARES_PER_SPOT, MAX_SNARES_TOTAL, MEAT_HAUL_CAP, RACK_CAP, SHOT_HIT_RECOVERED, SHOT_MISS_LOST, SHOT_MISS_RECOVERED, TUNING, carryBlocked, rollHuntSpecies, rollSmallGame } from './tuning.ts';
import { $, hideModal, sfxMooseCall, showModal, typewriterInto } from './ui.ts';
// ============================== actions: woods ==============================
export function actForage(){
  const hrs = (S.berryPicker ? 0.8 : 1) * TUNING.costs.forageMin/60;
  const cost = TUNING.costs.forageE;
  if (!spend(cost,hrs,true,'o')) return;
  const winterPenalty = S.winter ? 0.22 : 0;
  const pFail = 0.28 + 0.06*S.forageDep - (S.berryPicker?0.08:0) + winterPenalty;
  if (rand() < pFail) log((S.winter ? 'Nothing. ' : 'Nothing. ') + (S.winter ? 'The ground is frozen and bare - little left to find this deep into the season.' : (S.forageDep >= 4 ? 'The ground near camp is picked clean.' : 'The search turns up nothing edible.')), 'bad');
  else {
    const r = rand();
    if (r < 0.75){ addBerries(1); log('Found some. Berries and edible greens. +1 berries', 'good'); }
    else if (r < 0.96){ addBerries(2); log(`Good find. A good patch - berries, roots, greens. +2 berries`, 'good'); }
    else if (S.carry.wood<CARRY_CAP.wood && !carryBlocked('wood')){ addBerries(2); S.carry.wood++; log('Good find. A berry thicket plus dry deadfall. +2 berries, +1 log', 'good'); }
    else { addBerries(2); log('Good find. A good berry thicket. +2 berries', 'good'); }
  }
  S.forageDep = Math.min(10, S.forageDep + 1);
  afterAction('forage');
}
export function actTinder(){
  if (!spend(2,TUNING.costs.tinderMin/60,true,'o')) return;
  const n = TUNING.costs.tinderYieldLo + (rand()<0.5 ? TUNING.costs.tinderYieldHi-TUNING.costs.tinderYieldLo : 0);
  S.tinder += n;
  log(`Got some. You strip dry inner bark and dead grass into a tinder bundle. +${n} tinder`, 'good');
  afterAction('tinder');
}
export function exploreNewGrounds(kind?, spotId?){
  const list = kind==='woods' ? S.woodsSpots : S.shoreSpots;
  const sp = list.find(s=>s.id===spotId);
  if (!sp || sp.noLuck<3){ hideModal(); return; }
  if (!spend(3,0.25,true,'o')){ hideModal(); return; }
  const pool = kind==='woods' ? TUNING.catchRates.snareSpotQ : TUNING.catchRates.lineSpotQ;
  sp.q = pick(pool); sp.noLuck = 0;
  hideModal();
  log(`Fresher ground found. You cast a wider loop and find it near the ${sp.name}. Worth trying again.`, 'good');
  afterAction('explore');
}
export function openSnareModal(){
  if (!hasKit('wire')){ showModal(`<h3>No snare wire</h3><div class="wsub">You didn't draft any - snaring was never an option this run.</div><button class="mbtn ghost" onclick="hideModal()">Close</button>`); return; }
  if (S.wireStock <= 0){ showModal(`<h3>Out of wire</h3><div class="wsub">The last of your snare wire is used up. Setting snares is finished for this run.</div><button class="mbtn ghost" onclick="hideModal()">Close</button>`); return; }
  if (S.snareList.length>=MAX_SNARES_TOTAL){ showModal(`<h3>Trapline full</h3><div class="wsub">All ${MAX_SNARES_TOTAL} snares you can carry are already out.</div><button class="mbtn ghost" onclick="hideModal()">Close</button>`); return; }
  const rows = S.woodsSpots.map(sp => {
    const countHere = S.snareList.filter(sn=>sn.spotId===sp.id).length;
    const full = countHere >= MAX_SNARES_PER_SPOT;
    const dead = sp.noLuck>=3;
    return `<li style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
      <span>${sp.name} <span class="micro" style="display:inline">· ${countHere}/${MAX_SNARES_PER_SPOT}${dead?' · dead for days':''}</span></span>
      <span style="display:flex;gap:6px">
      <button class="mbtn ghost" style="width:auto;padding:8px 12px;margin:0" ${full?'disabled':''} onclick="placeSnareAt('${sp.id}')">Set here</button>
      ${dead?`<button class="mbtn ghost" style="width:auto;padding:8px 12px;margin:0" onclick="exploreNewGrounds('woods','${sp.id}')">Explore new grounds</button>`:''}
      </span>
    </li>`;
  }).join('');
  showModal(`<h3>Set a snare</h3><div class="wsub">Pick a spot along the trapline. −2⚡ · 5min · ${S.wireStock} wire left</div><ul>${rows}</ul><button class="mbtn ghost" onclick="hideModal()">Cancel</button>`);
}
export function placeSnareAt(id?){
  const sp = S.woodsSpots.find(s=>s.id===id);
  const countHere = S.snareList.filter(sn=>sn.spotId===id).length;
  if (!sp || countHere>=MAX_SNARES_PER_SPOT || S.snareList.length>=MAX_SNARES_TOTAL || S.wireStock<=0){ hideModal(); return; }
  if (!spend(2,0.0833,true,'oh')){ hideModal(); return; }
  S.snareList.push({spotId:id, day:S.day, lastCheck:S.day});
  consumeKitStock('wire');
  hideModal();
  log(`You set a wire snare at the ${sp.name}. (${S.snareList.length}/${MAX_SNARES_TOTAL})`, 'good');
  afterAction('snare');
}
export function openMoveSnareModal(){
  if (!S.snareList.length){ showModal(`<h3>Nothing to move</h3><div class="wsub">You have no snares out yet.</div><button class="mbtn ghost" onclick="hideModal()">Close</button>`); return; }
  const rows = S.snareList.map((sn,i) => {
    const sp = S.woodsSpots.find(s=>s.id===sn.spotId);
    return `<li style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <span>Snare ${i+1} - ${sp.name}</span>
      <button class="mbtn ghost" style="width:auto;padding:8px 12px;margin:0" onclick="openMoveSnareTarget(${i})">Pull up</button>
    </li>`;
  }).join('');
  showModal(`<h3>Move a snare</h3><ul>${rows}</ul><button class="mbtn ghost" onclick="hideModal()">Cancel</button>`);
}
export function openMoveSnareTarget(idx?){
  const sn = S.snareList[idx];
  if (!sn){ hideModal(); return; }
  const rows = S.woodsSpots.filter(sp => {
    const cnt = S.snareList.filter(x=>x.spotId===sp.id).length;
    return cnt < MAX_SNARES_PER_SPOT;
  }).map(sp => `<li style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <span>${sp.name}</span>
      <button class="mbtn ghost" style="width:auto;padding:8px 12px;margin:0" onclick="moveSnare(${idx},'${sp.id}')">Reset here</button>
    </li>`).join('');
  if (!rows){ showModal(`<h3>No room</h3><div class="wsub">Every spot is already full.</div><button class="mbtn ghost" onclick="hideModal()">Close</button>`); return; }
  showModal(`<h3>Move to…</h3><ul>${rows}</ul><button class="mbtn ghost" onclick="hideModal()">Cancel</button>`);
}
export function moveSnare(idx?, toId?){
  const sn = S.snareList[idx];
  if (!sn){ hideModal(); return; }
  if (!spend(2,0.0833,true,'o')){ hideModal(); return; }
  sn.spotId = toId; sn.lastCheck = S.day;
  hideModal();
  log(`You pull the snare and reset it elsewhere.`, 'good');
  afterAction('moveSnare');
}
export function actCheckTraps(){
  if (!S.snareList.length) return;
  openCheckTrapsModal();
}
export function openCheckTrapsModal(){
  const rows = S.snareList.map((sn,i) => {
    const sp = S.woodsSpots.find(s=>s.id===sn.spotId);
    return `<li id="snareRow${i}" style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <span>Snare ${i+1} - ${sp.name}</span>
      <button class="mbtn ghost" style="width:auto;padding:8px 12px;margin:0" onclick="checkOneSnare(${i})">Check</button>
    </li>`;
  }).join('');
  showModal(`<h3>The trapline</h3><div class="wsub">Check each snare - 1min · 1⚡ each</div><ul id="trapRows">${rows}</ul><button class="mbtn ghost" onclick="hideModal()">Done</button>`);
}
export function pityMultiplier(){
  const t = TUNING.catchRates;
  if (S.zeroCatchDayStreak < t.pityThresholdDays) return 1.0;
  const extra = S.zeroCatchDayStreak - t.pityThresholdDays + 1;
  return Math.min(t.pityMultiplierCap, 1.0 + extra * t.pityMultiplierStep);
}
// v12 §1.1/§1.5: verdict-first writing - "You've got it." / "You missed." leads, then mechanism, cost/gain, hook.
export function checkOneSnare(i?){
  const sn = S.snareList[i];
  if (!sn) return;
  const sp = S.woodsSpots.find(s=>s.id===sn.spotId);
  if (!spend(1,0.0167,true,'o')) return;
  const days = Math.max(1, Math.min(3, S.day - sn.lastCheck));
  sn.lastCheck = S.day;
  let hit = false;
  let q = Math.min(0.9, sp.q * pityMultiplier()) * TUNING.food.passiveCutMultiplier;
  if (S.winter) q = Math.min(q, (1/TUNING.catchRates.postSnowSnareDaysPerCatch) / Math.max(1,S.snareList.length));
  for (let d=0; d<days; d++) if (rand() < q) hit = true;
  let resultText;
  if (hit){
    const species = rollSmallGame(); const g = GAME[species];
    const hoursInSnare = (days) * 24;
    const spoiledOnArrival = !S.winter && hoursInSnare > TUNING.food.snareDeathSpoilHours;
    if (spoiledOnArrival){
      sp.noLuck = 0; S.anyCatchToday = true;
      resultText = `✗ ${g.label} - dead too long, spoiled`;
      spoilageSting();
      log(`Caught, but too late. ${g.label.charAt(0).toUpperCase()+g.label.slice(1)} was in the wire too long in the warmth and turned before you got here - spoiled, not salvageable. −morale, +stress`, 'bad');
    } else {
      addMeat(g.meat, 'snared'); sp.noLuck = 0; S.anyCatchToday = true;
      resultText = `✓ ${g.label} - ${g.meat} meat`;
      log(`Caught. ${g.label.charAt(0).toUpperCase()+g.label.slice(1)}, clean in the wire. +${g.meat} meat.`, 'good');
      if (species==='fatHare' && rand()<0.5) maybeRenameSpot(sp,'fatCatch');
    }
  } else {
    sp.noLuck++; resultText = '- empty'; S.morale = clamp(S.morale - 1); S.stress = clamp(S.stress + 1);
    registerEmptyCheck();
    log('Empty. Nothing in the wire - the sign here has gone quiet.', 'bad');
    if (sp.noLuck>=5) maybeRenameSpot(sp,'deadWoods');
  }
  const row = $('snareRow'+i);
  if (row) row.innerHTML = `<span>Snare ${i+1} - ${sp.name}: ${resultText}</span>`;
  afterAction('checkTraps');
}
export function maybeWarnNightSight(){
  if (S._nightSightWarned) return;
  S._nightSightWarned = true;
  log('You can\'t track what you can\'t see.', 'sys');
}
export function actScout(){
  const pressureMul = 1 + S.huntPressure/150;
  if (!spend(Math.round(TUNING.costs.scoutE*pressureMul), 0.5*pressureMul, true, 'ow')) return;
  const night = isNightNow();
  if (night) maybeWarnNightSight();
  const pressureDrag = S.huntPressure/100 * 0.12;
  const r = rand();
  const sightMul = night ? TUNING.night.sightUselessMultiplier : 1;
  if (r < Math.max(0.02, 0.05-pressureDrag)*sightMul){ S.hunt = {state:'hot', day:S.day, species:''}; log('Found something. Steam still rising off a bed of flattened grass - it was JUST here. The trail is hot.', 'good'); }
  else if (r < Math.max(0.10, 0.22-pressureDrag)*sightMul){ S.hunt = {state:'tracks', day:S.day, species:''}; log('Found something. Tracks. A day old at most, heading up the ridge.', 'good'); }
  else log('Nothing. ' + (night ? 'Too dark to read the ground - you cover ground blind and hope.' : pick(S.huntPressure>40
    ? ['Whatever\'s left of the game around here has learned to keep its distance.','You range farther than usual and still come up empty. The animals near camp have wised up.','Empty country close in. You\'d have to push out much farther to find anything now.']
    : ['Old sign everywhere, nothing fresh.','You glass the ridgelines for hours. Empty country.','Ravens over the far valley - too far to matter today.'])), 'bad');
  afterAction('scout');
}
export function actFollow(){
  if (S.hunt.state !== 'tracks' && S.hunt.state !== 'hot') return;
  const pressureMul = 1 + S.huntPressure/150;
  // v12 §10.3: tracking energy halved.
  if (!spend(Math.round(TUNING.costs.followBaseE*pressureMul), 0.75*pressureMul, true, 'ow')) return;
  const p = (S.hunt.state === 'hot' ? 0.52 : 0.32) - S.huntPressure/100*0.10;
  if (rand() < p){
    const species = rollHuntSpecies();
    S.hunt = {state:'spotted', day:S.day, species};
    log(`Found it. There - through the timber. ${GAME[species].label}, feeding, unaware. Your heart is pounding.`, 'good');
  } else if (rand() < 0.5){
    S.hunt.day = S.day;
    log('Still on it, barely. The trail loops and doubles back through a bog - you keep the tracks, but lose the hours.', 'bad');
  } else {
    S.hunt = {state:'none', day:0, species:''};
    log(`Lost it. The tracks vanish on stony ground. ${S.hunt.species?GAME[S.hunt.species]?.label:'It'}'s gone.`, 'bad');
  }
  afterAction('follow');
}
export function showShotModal(title?, body?){
  showModal(`<h3>🏹 ${title}</h3><div class="wsub">${body}</div><div class="wsub" style="margin-top:6px">Quiver: <b>${S.arrows}/9</b></div><button class="mbtn ghost" onclick="hideModal()">Continue</button>`);
}
export function rackCapacitySummary(){
  const parts = [];
  if (S.rackTier > 0) parts.push(`the smoking rack (cap ${RACK_CAP[S.rackTier]})`);
  if (S.hugeRack) parts.push(`the huge rack (cap ${HUGE_RACK_CAP})`);
  if (!parts.length) return `I'd need a rack up before this makes sense.`;
  return `I've got ${parts.join(' and ')} to work with.`;
}
export function maybeShotIntrospection(species?, onProceed?){
  const g = GAME[species];
  if (!g || g.tier === 'small' || ambientTempC(false) <= 0){ onProceed(); return; }
  const text = `That's a lot of meat starting to die the second it hits the ground. Unless I smoke or cook it inside a day, it's wasted. ${rackCapacitySummary()} Worth it?`;
  showModal(`<h3>Before you loose it</h3><div class="wsub">${text}</div>
    <button class="mbtn" onclick="hideModal(); fireShot()">Take the shot</button>
    <button class="mbtn ghost" onclick="hideModal()">Hold off</button>`);
}
export function actShot(){
  if (S.hunt.state !== 'spotted') return;
  if (S.arrows <= 0) return;
  if (S.hunt.small || ambientTempC(false) <= 0 || S._introspectedShot){ S._introspectedShot = false; fireShot(); return; }
  S._introspectedShot = true;
  maybeShotIntrospection(S.hunt.species, () => { fireShot(); });
}
// v12 §1.1: "You've got it." / "You missed." leads every shot resolution, then arrow fate, then meat/blood-trail consequence.
export function fireShot(){
  if (S.hunt.state !== 'spotted') return;
  if (S.arrows <= 0) return;
  if (!spend(5,0.1667,true,'ow')) return;
  S.arrows--;
  const species = S.hunt.species;
  const poolKey = S.winter ? 'snow' : (S.loc==='shore' ? 'shore' : 'woods');
  const nightShot = isNightNow();
  if (nightShot) maybeWarnNightSight();
  const sightMul = nightShot ? TUNING.night.sightUselessMultiplier : 1;
  let title, body;
  if (S.hunt.small){
    const g = GAME[species];
    const label = g.label.charAt(0).toUpperCase()+g.label.slice(1);
    const successRate = ({grouse:0.45, fatGrouse:0.40, duck:0.35, squirrel:0.30}[species] || 0.35) * sightMul;
    if (rand() < successRate){
      addMeat(g.meat, species);
      const recovered = rand() < 0.6;
      if (recovered) S.arrows++;
      title = "You've got it.";
      body = `${label} down, clean. +${g.meat} meat. ` + (recovered ? pick(SHOT_HIT_RECOVERED) : pick(SHOT_MISS_LOST[poolKey]));
      log(`You've got it. ${g.label} down. +${g.meat} meat.`, 'good');
    } else {
      const recovered = rand() < 0.5;
      if (recovered) S.arrows++;
      title = 'You missed.';
      body = `${label} is gone in a blink. ` + (recovered ? pick(SHOT_MISS_RECOVERED[poolKey]) : pick(SHOT_MISS_LOST[poolKey]));
      log(`You missed. ${label} is gone in a blink.`, 'bad');
    }
    S.hunt = {state:'none', day:0, species:''};
    showShotModal(title, body);
    afterAction('shot');
    return;
  }
  const r = rand();
  if (r < 0.40*sightMul){
    S.hunt = {state:'trailing', day:S.day, species, wounded:false};
    title = "You've got it.";
    body = `The arrow flies true. ${GAME[species].label} bolts hard into the brush - the arrow travels with it, recoverable at the kill site once it's down. Follow the blood trail before it's gone.`;
    log(`You've got it. The arrow flies true - ${GAME[species].label} bolts hard into the brush. Follow the blood trail before it's gone.`, 'good');
  } else if (r < 0.62*sightMul){
    S.hunt = {state:'trailing', day:S.day, species, wounded:true};
    title = "You've got it - but it's ugly.";
    body = `The arrow catches ${GAME[species].label} wrong - not a clean hit. It's wounded and running, the arrow still with it. The trail won't stay fresh.`;
    log(`Hit, but not clean. ${GAME[species].label} is wounded and running - the trail won't stay fresh.`, 'bad');
  } else {
    const recovered = rand() < 0.5;
    if (recovered) S.arrows++;
    title = 'You missed.';
    body = recovered ? pick(SHOT_MISS_RECOVERED[poolKey]) : pick(SHOT_MISS_LOST[poolKey]);
    log(recovered ? 'You missed. The arrow skips off wide - you find it again in the brush.' : 'You missed. The arrow skips off wide and is gone.', 'bad');
    if (hasTrait('prideful')){ resolveDelta(-4); log('That one stings more than it should. You don\'t miss well.', 'bad'); body += ' That one stings more than it should.'; }
    S.hunt = {state:'none', day:0, species:''};
  }
  showShotModal(title, body);
  afterAction('shot');
}
export function actTrail(){
  if (S.hunt.state !== 'trailing') return;
  // v12 §10.3: tracking energy halved (was 6).
  if (!spend(TUNING.costs.trailBaseE,0.5,true,'ow')) return;
  const p = S.hunt.wounded ? 0.32 : 0.58;
  const r = rand();
  if (r < p) killAnimal(S.hunt.species);
  else if (r < p+0.28) log('Still on it. The blood trail thins over stony ground, but you\'re still on it.', 'bad');
  else {
    log(`Lost it. The blood trail goes cold. ${GAME[S.hunt.species].label} is gone.`, 'bad');
    rememberLostAnimal(S.hunt.species);
    S.hunt = {state:'none', day:0, species:''};
  }
  afterAction('trail');
}
export function rememberLostAnimal(species?){
  const details = ['a notch out of one ear','a limp it never lost','a pale patch across one shoulder','one broken antler tine','a scar across its flank','eyes that found yours before it broke for the treeline'];
  S.lostAnimal = {species, detail: pick(details), day: S.day};
  S.lostAnimalResighted = false;
}
export function killAnimal(species?){
  const g = GAME[species];
  S.hunt = {state:'none', day:0, species:''};
  S.lastKillDay = S.day;
  S.confessPrompt = true;
  resolveDelta(4);
  if (!S.firstKill) S.firstKill = {species, day:S.day};
  const killedAtCamp = S.loc === 'camp';
  S.killSite = {species, loc:S.loc, meatTotal:g.meat, meatRemaining:g.meat, carved:false, day:S.day, spawnAbs:nowAbs(), predatorEvents:0, draggedFromCamp:killedAtCamp};
  S.tot[species] = (S.tot[species]||0) + 1;
  S.tot.animalsKilled = (S.tot.animalsKilled||0) + 1;
  S.huntPressure = clamp(S.huntPressure + (g.tier==='big'?35:22), 0, 100);
  S.noSignStreak = 0;
  const label = g.label.charAt(0).toUpperCase()+g.label.slice(1);
  const killText = `You've got it - down for good. You kneel by it a moment - this is what keeps you here another week. A quiet thanks, meant. ${g.tier==='big' ? `${g.meat} lbs of meat on the ground. Far more than one trip will carry - carve it, then haul it back in loads.${killedAtCamp ? ' You drag it a short distance off first - blood near the shelter isn\'t an option.' : ''}` : `${g.meat} lbs of meat. A solid haul - carve it, then bring it home.`}`;
  showModal(`<h3>${label}</h3>
    <div class="wsub">The hunt is over.</div>
    <div class="wsub tw" id="twKill" onclick="skipTypewriter('twKill')"></div>
    <button class="mbtn" onclick="hideModal()">Continue</button>`);
  typewriterInto('twKill', killText, 14);
}
export function actCarve(){
  if (!S.killSite || S.killSite.carved || S.loc !== S.killSite.loc) return;
  const big = GAME[S.killSite.species].tier === 'big';
  const knifeMul = hasKit('knife') ? 0.75 : 1;
  if (!spend(Math.round((big?18:12)*knifeMul), (big?2:1.2)*knifeMul, false, 'hw')) return;
  S.killSite.carved = true;
  const hideGain = big ? 2 : 1;
  S.hide += hideGain;
  let msg = `Broken down clean. Hide, quarters, the good cuts set aside. Hard, careful work. +${hideGain} hide`;
  if (rand() < 0.7){ S.arrows++; msg += ' The arrow comes back clean out of the carcass.'; }
  log(msg, 'good');
  afterAction('carve');
}
export function actHaul(){
  if (!S.killSite || !S.killSite.carved) return;
  if (S.killSiteCarry > 0){ if (S.loc === S.killSite.loc) haulWalkIn(); return; }
  if (S.loc === 'camp' && S.killSite.meatRemaining > 0){ haulWalkBack(); return; }
  if (S.loc !== S.killSite.loc) return;
  const take = Math.min(MEAT_HAUL_CAP, S.killSite.meatRemaining);
  if (take <= 0) return;
  S.killSite.meatRemaining -= take;
  S.killSiteCarry = take;
  log(`You load ${take} lbs onto your back at the kill site.`, 'good');
  afterAction('haul');
}
export function haulWalkIn(){
  if (S.killSiteCarry <= 0) return;
  const e = TUNING.costs.haulLoadedE, hrs = TUNING.costs.haulLoadedMin/60;
  if (!spend(e, hrs, true, 'ot')) return;
  addMeat(S.killSiteCarry, S.killSite ? S.killSite.species : undefined);
  const took = S.killSiteCarry;
  S.killSiteCarry = 0;
  S.loc = 'camp';
  if (S.killSite && S.killSite.meatRemaining <= 0){
    log(`Delivered. The last load - ${GAME[S.killSite.species].label} is fully hauled in. +${took} meat`, 'good');
    S.killSite = null;
  } else {
    log(`Delivered. You haul the load back to camp, drop it into storage. +${took} meat. Walk back for the rest.`, 'good');
  }
  afterAction('haulIn');
}
export function haulWalkBack(){
  if (!S.killSite || S.killSite.meatRemaining <= 0) return;
  const e = TUNING.costs.haulUnloadedE, hrs = TUNING.costs.haulUnloadedMin/60;
  if (!spend(e, hrs, true, 'ot')) return;
  S.loc = S.killSite.loc;
  log('You walk back out to the kill site for another load.', 'sys');
  afterAction('haulBack');
}
export function actCall(){
  if (!spend(2,0.0833,true,'o')) return;
  S.mooseLure = clamp(S.mooseLure + 8 + rand()*5, 0, 100);
  sfxMooseCall();
  log('Nothing yet. You cup your hands and let out a long, guttural moose call. It rolls off across the water and dies.', 'sys');
  afterAction('call');
}
export function actInvestigate(){
  if (!S.soundsWoods) return;
  if (!spend(6,0.5,true,'o')) return;
  S.soundsWoods = false;
  const r = rand();
  if (r < 0.30){ S.hunt = {state:'hot', day:S.day, species:''}; log('Found sign. Snapped branches, churned earth - whatever it was, it was big, and it was just here.', 'good'); }
  else if (r < 0.42){ const species = rand()<0.5?'moose':rollHuntSpecies(); S.hunt = {state:'spotted', day:S.day, species}; log(`Found it. You ease over the rise and freeze. ${GAME[species].label}, browsing the willows, unaware.`, 'good'); }
  else if (r < 0.54){ S.stress = clamp(S.stress + 18); S.morale = clamp(S.morale - 5); S.tot.predators++;
    log('It was a bear. A black shape rises out of the brush and huffs once. You back away the whole half mile to camp.', 'bad'); }
  else log('Nothing. Wind in the deadfall - whatever made the noise is long gone.', 'bad');
  afterAction('invest');
}
// v12 kit-draft §2: felling logs requires axe/saw/shovel. Without any of them, actWood() is unreachable
// (the button stays hidden in render()) - firewood (actFirewood, below) is always available by hand.
export function actWood(){
  if (S.carry.wood >= CARRY_CAP.wood || carryBlocked('wood')) return;
  if (!hasKit('axe') && !hasKit('saw') && !hasKit('shovel')) return;
  if (hasKit('axe') && S.gear.axe <= 0){ actAxeHandleBreak(); return; }
  const sawBonus = (hasKit('axe') && hasKit('saw')) ? 0.8 : (hasKit('shovel') && !hasKit('axe') && !hasKit('saw')) ? 1.3 : 1;
  const axeWeak = hasKit('axe') && S.gear.axe < 30;
  if (!spend(Math.round((axeWeak?9:6)*sawBonus), (axeWeak?1.3:1)*sawBonus, true, 'ohw wood')) return;
  let n = 3 + Math.floor(rand()*3);
  if (S.weather === 'storm') n = Math.max(1, n-1);
  if (axeWeak) n = Math.max(1, n-1);
  n = Math.min(n, CARRY_CAP.wood - S.carry.wood);
  S.carry.wood += n; S.tot.wood += n;
  if (hasKit('axe')){
    S.gear.axe = Math.max(0, S.gear.axe - 2.5);
    if (S.gear.axe <= 15 && rand() < 0.08) { actAxeHandleBreak(); return; }
  }
  log(`Felled and bucked. +${n} logs (carrying ${S.carry.wood}/${CARRY_CAP.wood})${axeWeak?' - the axe is dull, this is getting harder':''}`, 'good');
  afterAction('wood');
}
// v12 kit-draft §2: firewood is always hand-gatherable, no tool needed - the safety valve that keeps
// fire achievable in any legal draft.
export function actFirewood(){
  if (!spend(4,0.5,true,'o')) return;
  let n = 3 + Math.floor(rand()*3);
  S.stock.firewood += n;
  log(`Gathered by hand. +${n} firewood`, 'good');
  afterAction('firewood');
}
export function actMoss(){
  if (S.carry.moss >= CARRY_CAP.moss || carryBlocked('moss')) return;
  if (!spend(5,0.5,true,'oh')) return;
  let n = 3 + Math.floor(rand()*2);
  n = Math.min(n, CARRY_CAP.moss - S.carry.moss);
  S.carry.moss += n;
  log(`You peel thick sphagnum moss off the rocks. +${n} moss (carrying ${S.carry.moss}/${CARRY_CAP.moss})`, 'good');
  afterAction('moss');
}

