// Ported from legacy/tap-out-v12.html (lines 3112-3759). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { rand } from './runtime.ts';
import { berryCount, cookedMealSpoiled, discardSpoiledBerries, discardSpoiledMeat, meatCount, oldestBerriesSpoiled, oldestMeatSpoiled, spoilageSting, takeBerries, takeMeat } from './food.ts';
import { clamp, nowAbs, pick } from './helpers.ts';
import { hasTrait } from './interior.ts';
import { applyPoulticeDose, triggerMedicalArc } from './medical.ts';
import { takeSmoked } from './person.ts';
import { resolveDelta } from './resolve.ts';
import { hasKit, log, registerWasteDiscard, waterCap } from './setup.ts';
import { RULES, say } from './rules.ts';
import { S } from './state.ts';
import { afterAction, spend, spendOrDebt, tickShiverClear } from './threads.ts';
import { BUILD_NEED, CACHE_COST, CACHE_NEED, DRINK_LINES, DUGOUT_COST, DUGOUT_NEED, EAT_BERRIES, EAT_COOKED, EAT_SMOKED, FIREPIT_COST, FIREPIT_NEED, HUGE_RACK_CAP, HUGE_RACK_COST, ICE_CACHE_COST, RATIONS, ICE_CACHE_NEED, RACK_CAP, RACK_COST, SHELTERS, SHELTER_COST, TUNING, WEATHER } from './tuning.ts';
import { render, sfxBuild, sfxCooking, sfxDrink, sfxEat, sfxFireLight, showModal } from './ui.ts';
import { triggerBearDread } from './worry.ts';
// ============================== actions: camp ==============================
export function fireCap(){ return [8,12,16][S.firepitTier]; }
// v12 kit-draft §2/§3.2: fire runs on FIREWOOD (hand-gatherable, never structurally gated); without a
// ferro rod, lighting one is a friction-fire attempt instead - slower, weather-dependent, a morale
// sting per failed try, never impossible (the safety-valve rule from kit-draft §5.1).
export function actFire(){
  if (S.over) return;
  const lightWoodCost = S.firepitTier>=2 ? 1 : 2;
  const stokeGain = [2,3,4][S.firepitTier];
  if (S.fireH > 0){
    if (S.stock.firewood < 1 || S.fireH >= fireCap()) return;
    if (!spend(0,0,false,'')) return;
    S.stock.firewood--;
    S.fireH = Math.min(fireCap(), S.fireH + stokeGain);
    S.morale = clamp(S.morale + 1);
    log('You feed the fire. It crackles higher. +morale', 'good');
    afterAction('fire');
    return;
  }
  if (!hasKit('ferro')){ actFrictionFire(); return; }
  if (S.stock.firewood < lightWoodCost || S.tinder < 1) return;
  if (!spend(0,0,false,'')) return;
  S.tinder--;
  const ferroMul = S.gear.ferro <= 0 ? 0.55 : S.gear.ferro < 30 ? 0.8 : 1;
  S.gear.ferro = Math.max(0, S.gear.ferro - 2);
  if (rand() < Math.min(0.95, WEATHER[S.weather].fireChance + S.structure*0.05) * ferroMul){
    S.stock.firewood -= lightWoodCost; S.fireH = 4; S.tot.fires++;
    sfxFireLight();
    log('Caught. The tinder catches on the first spark - fire is going.', 'good');
  } else log(S.gear.ferro<=0 ? 'No spark. The rod\'s all but worn smooth this time. −1 tinder' : 'No spark. Damp tinder, smoke and frustration, no flame. −1 tinder', 'bad');
  afterAction('fire');
}
export function actFireNoFerro(){ actFire(); }
// kit-draft §2 friction-fire fallback: ~1-2h attempt, weather-dependent fail chance, morale sting per fail.
export function actFrictionFire(){
  if (S.over || S.fireH > 0) return;
  const lightWoodCost = S.firepitTier>=2 ? 1 : 2;
  if (S.stock.firewood < lightWoodCost || S.tinder < 1) return;
  if (!spend(6, 1.5, false, 'h')) return;
  S.tinder--;
  const chance = Math.min(0.7, (WEATHER[S.weather].fireChance - 0.15) + S.structure*0.03);
  if (rand() < chance){
    S.stock.firewood -= lightWoodCost; S.fireH = 4; S.tot.fires++;
    sfxFireLight();
    log('Caught, finally. Bow-drill friction fire - your arms are shaking, but it caught. Fire is going.', 'good');
  } else {
    S.morale = clamp(S.morale - 4);
    log('No catch. An hour and a half of bow-drill work and the ember never takes. −morale, −1 tinder', 'bad');
  }
  afterAction('friction');
}
export function actBoil(){
  if (!hasKit('pot')) return;
  if (S.fireH <= 0 || S.rawWater <= 0 || S.water >= waterCap()) return;
  if (!spendOrDebt(3,0.25)) return;
  const amt = Math.min(3, S.rawWater, waterCap() - S.water);
  S.rawWater -= amt; S.water += amt;
  sfxCooking();
  log(`Boiled clean. Pot after pot, set to cool. +${amt} safe water`, 'good');
  afterAction('boil');
}
export function actCookMeal(){
  if (!hasKit('pot')) return;
  if (S.cookedMeal) return;
  if (S.fireH <= 0 || meatCount() < 2 || S.water < 2) return;
  if (oldestMeatSpoiled()){ confirmCookSpoiled(); return; }
  doCookMeal();
}
export function doCookMeal(){
  const knifeMul = hasKit('knife') ? 0.75 : 1;
  if (!spendOrDebt(4, 0.25*knifeMul)) return false;
  takeMeat(2); S.water -= 2;
  S.cookedMeal = {abs: nowAbs()};
  S.morale = clamp(S.morale + 2);
  S.consecutiveSmokedOnlyDays = 0;
  clearTeethProgress();
  sfxCooking();
  log('Cooked clean. Two portions worked into a real meal over the fire. +morale', 'good');
  afterAction('cook');
  return true;
}
export function confirmCookSpoiled(){
  showModal(`<h3>That meat has turned</h3><div class="wsub">Cooking won't fully save meat this far gone. Use it anyway, or throw it out?</div>
    <button class="mbtn" onclick="hideModal(); cookSpoiledAnyway()">Cook it anyway</button>
    <button class="mbtn ghost" onclick="hideModal(); discardSpoiledMeatUI()">Throw it out</button>`);
}
export function cookSpoiledAnyway(){
  if (!doCookMeal()) return;
  spoilageSting();
  if (rand() < 0.5) triggerMedicalArc('badMeat');
}
export function discardSpoiledMeatUI(){
  const n = discardSpoiledMeat();
  spoilageSting();
  registerWasteDiscard(n);
  log(`Tossed. ${n} pounds of spoiled meat, gone for nothing. −morale, +stress`, 'sys');
  render();
}
export function actSmoke(){
  if (S.smokingSession) return;
  if (S.rackTier<=0 || S.fireH <= 0 || meatCount() <= 0) return;
  if (S.stock.firewood < 1 || S.tinder < 1) return;
  if (oldestMeatSpoiled()){ confirmSmokeSpoiled('rack'); return; }
  doSmoke(false, 'rack');
}
export function actSmokeHuge(){
  if (S.hugeSmokingSession) return;
  if (!S.hugeRack || S.fireH <= 0 || meatCount() <= 0) return;
  if (S.stock.firewood < 2 || S.tinder < 1) return;
  if (oldestMeatSpoiled()){ confirmSmokeSpoiled('huge'); return; }
  doSmoke(false, 'huge');
}
export function confirmSmokeSpoiled(which?){
  showModal(`<h3>That meat has turned</h3><div class="wsub">Smoking won't save meat this far gone - it'll just contaminate the whole batch. Smoke it anyway, or throw the spoiled portion out first?</div>
    <button class="mbtn" onclick="hideModal(); doSmoke(true,'${which}')">Smoke it anyway</button>
    <button class="mbtn ghost" onclick="hideModal(); discardSpoiledMeatUI()">Throw out the spoiled part first</button>`);
}
export function doSmoke(contaminated?, which?){
  const isHuge = which === 'huge';
  const woodCost = isHuge ? 2 : 1;
  if (S.stock.firewood < woodCost || S.tinder < 1) return;
  const knifeMul = hasKit('knife') ? 0.75 : 1;
  if (!spend(5, 0.25*knifeMul, false, '')) return;
  S.stock.firewood -= woodCost; S.tinder -= 1;
  const cap = isHuge ? HUGE_RACK_CAP : RACK_CAP[S.rackTier];
  const n = takeMeat(Math.min(cap, meatCount()));
  const session = {n, startAbs: nowAbs(), doneAbs: nowAbs()+12, contaminated: !!contaminated};
  if (isHuge) S.hugeSmokingSession = session; else S.smokingSession = session;
  sfxCooking();
  let msg = contaminated
    ? `On the rack anyway. You lay ${n} portion${n>1?'s':''} over the ${isHuge?'huge ':''}smoke, spoiled meat and all. Ready in about half a day - for whatever that's worth now.`
    : `On the rack. You lay ${n} portion${n>1?'s':''} over the ${isHuge?'huge ':''}smoke. Ready in about half a day.`;
  if (S.hour>=22){ S.stress = clamp(S.stress+6); msg += ' Working by firelight in the dark leaves you jumpier than usual. +stress'; }
  if (contaminated) spoilageSting();
  log(msg, 'good');
  maybeSmokingVisitor();
  afterAction('smoke');
}
export function smokingVisitorPool(){
  return [
    {kind:'fox', huntable:true, text:'🦊 A fox has caught the smell and is circling just outside the firelight, bold as anything.'},
    {kind:'wolverine', huntable:true, text:'🦡 That smell has pulled a wolverine in close - it\'s not leaving without a fight over it.'},
    {kind:'marten', huntable:false, text:`🐿 ${S.martenNamed} shows up for the smell, same as everything else does eventually.`},
    {kind:'wolf', huntable:false, text:'🐺 Something canine paces the treeline, drawn by the smoke - not coming closer, not leaving either.'},
    {kind:'grizzly', huntable:false, text:'🐻 The smell has carried further than you\'d like - something big is moving at the edge of the firelight.'},
  ];
}
export function maybeSmokingVisitor(){
  if (rand() > 0.18) return;
  const v = pick(smokingVisitorPool());
  S.stress = clamp(S.stress + (v.kind==='grizzly'?16:8));
  if (v.kind === 'wolf' || v.kind === 'grizzly') triggerBearDread();
  if (v.kind === 'fox' && S.hunt.state === 'none'){
    S.hunt = {state:'spotted', day:S.day, species:'fox', small:true};
    log(v.text + ' Worth a shot, if you\'re quick.', 'bad');
  } else {
    log(v.text, 'bad');
  }
}
// v12 kit-draft §2: renamed "scrounge nearby" now gathers FIREWOOD (day-texture rate unchanged),
// distinct from actWood()'s structural logs.
export function actWoodCamp(){
  if (S.campWoodStock <= 0) return;
  if (!spend(5,TUNING.costs.woodCampMin/60,true,'oh')) return;
  const n = Math.min(S.campWoodStock, 3 + Math.floor(rand()*3));
  S.campWoodStock -= n; S.stock.firewood += n; S.tot.wood += n;
  if (S.campWoodStock <= 0) log(`Last of it. You scrounge the final deadfall near camp. +${n} firewood. You'll need the woods from here.`, 'good');
  else log(`Gathered. Deadfall from around camp. +${n} firewood`, 'good');
  afterAction('woodCamp');
}
export function actDropOff(){
  if (S.loc !== 'camp') return;
  const any = S.carry.wood+S.carry.rocks+S.carry.moss+S.carry.clay > 0;
  if (!any) return;
  S.stock.wood += S.carry.wood; S.stock.rocks += S.carry.rocks; S.stock.moss += S.carry.moss; S.stock.clay += S.carry.clay;
  log(`You unload your pack: +${S.carry.wood} logs, +${S.carry.rocks} rocks, +${S.carry.moss} moss, +${S.carry.clay} clay to camp stock.`, 'good');
  S.carry.wood = 0; S.carry.rocks = 0; S.carry.moss = 0; S.carry.clay = 0;
  afterAction('dropoff');
}
export function actCampSnares(){
  if (S.campSnares || !S.hadFirstRaid || S.stock.wood<2) return;
  if (!spend(6,0.5,false,'h')) return;
  S.stock.wood -= 2;
  S.campSnares = true;
  log('You ring the cache with small snares and noisemakers. Should make raiders think twice.', 'good');
  afterAction('campSnares');
}
// kit-draft §3.7: soap - a small daily morale trickle when used, unrelated to infection-chance reduction
// (that's applied passively wherever infection rolls happen).
export function actWash(){
  if (!hasKit('soap') || S.washedToday) return;
  if (!spend(2,0.25,false,'')) return;
  S.washedToday = true;
  S.morale = clamp(S.morale + 3);
  log('You scrub down properly with the bar of soap. Small thing. Feels like a lot out here. +morale', 'good');
  afterAction('wash');
}

// ---- gear wear & repair ----
export function activeChainCount(){ return Object.values(S.chains).filter(Boolean).length; }
export function actAxeHandleBreak(){
  if (S.chains.axeHandle) return;
  S.chains.axeHandle = {day:S.day};
  S.gear.axe = 0;
  if (hasTrait('handy')) S.morale = clamp(S.morale - 4);
  const hurtHand = rand() < 0.25 && !S.injury;
  if (hurtHand){
    S.injury = {type:'wrist', days:3}; S.tot.injuries++;
    S.stress = clamp(S.stress+12); S.morale = clamp(S.morale-8);
    showModal(`<h3>The handle splits</h3><div class="wsub">Mid-swing, the axe handle gives out - old wood, one too many storms. The head glances and catches your wrist wrong.</div><ul><li>Sprained wrist (3 days) - hand work costs more until it heals.</li><li>No real wood-cutting until you carve and haft a new handle.</li></ul><button class="mbtn" onclick="hideModal()">Continue</button>`);
  } else {
    showModal(`<h3>The handle splits</h3><div class="wsub">Mid-swing, the haft gives out - old wood, one too many storms. You get lucky and the head just drops.</div><ul><li>No real wood-cutting until you carve and haft a new handle.</li></ul><button class="mbtn" onclick="hideModal()">Continue</button>`);
  }
  afterAction('axebreak');
}
export function actHaftAxe(){
  if (!hasKit('axe') || !S.chains.axeHandle || S.stock.wood<2) return;
  if (!spend(10,1.5,false,'hw')) return;
  S.stock.wood -= 2;
  S.gear.axe = 100;
  S.chains.axeHandle = null;
  log('You carve and haft a fresh handle onto the axe head. Good as new.', 'good');
  afterAction('haftaxe');
}
export function actBootFailure(){
  if (S.chains.boot) return;
  S.chains.boot = {day:S.day};
  S.gear.boots = 0;
  if (hasTrait('handy')) S.morale = clamp(S.morale - 4);
  showModal(`<h3>Your boots give out</h3><div class="wsub">The sole finally separates. Every step now means wet, frozen feet.</div><ul><li>Cold feet - extra warmth loss while moving, and a frostbite risk until it's fixed.</li><li>Improvise a repair with hide.</li></ul><button class="mbtn" onclick="hideModal()">Continue</button>`);
  afterAction('bootfail');
}
export function actRepairBoots(){
  if (!S.chains.boot || S.hide<2) return;
  if (!spend(10,1.5,false,'hw')) return;
  S.hide -= 2;
  S.gear.boots = 100;
  S.chains.boot = null;
  log('You lash a hide patch around the sole. Solid enough to last.', 'good');
  afterAction('repairboots');
}
export function actSharpenAxe(){
  if (!hasKit('axe') || S.gear.axe >= 100 || S.chains.axeHandle) return;
  if (!spend(4,0.5,false,'h')) return;
  S.gear.axe = 100;
  log('You take a while with the whetstone. The edge bites clean again.', 'good');
  afterAction('sharpen');
}
export function actMaintainFerro(){
  if (!hasKit('ferro') || S.gear.ferro >= 100) return;
  if (!spend(3,0.25,false,'h')) return;
  S.gear.ferro = 100;
  log('You clean the rod and strike a few practice sparks. Reliable again.', 'good');
  afterAction('ferro');
}
export function actPatchRoof(){
  if (!S.chains.roof || S.stock.wood<3 || S.stock.moss<3) return;
  if (!spend(10,1.5,true,'ohw')) return;
  S.stock.wood -= 3; S.stock.moss -= 3;
  S.chains.roof = null;
  log('You re-lash the frame and pack fresh moss into the tear. Dry again.', 'good');
  afterAction('patchroof');
}
export function actPoultice(){
  if (!S.medicalArc || S.medicalArc.stage!=='treatment') return;
  if (!spend(6,1,false,'h')) return;
  applyPoulticeDose();
  if (!RULES.poulticeOnce) afterAction('poultice'); // LEG-005: the dose already resolved the action
}
export function actShelter(){
  if (S.structure >= 3) return;
  const c = SHELTER_COST[S.structure];
  if (S.stock.wood < c.wood || (c.moss && S.stock.moss < c.moss) || (c.clay && S.stock.clay < c.clay)) return;
  if (!spend(c.e, c.h, true, 'ohw wood')) return;
  S.stock.wood -= c.wood; if (c.moss) S.stock.moss -= c.moss; if (c.clay) S.stock.clay -= c.clay;
  S.buildProg++;
  sfxBuild();
  const need = BUILD_NEED[S.structure];
  if (S.buildProg >= need){
    S.structure++; S.buildProg = 0;
    S.morale = clamp(S.morale + 8);
    log(`Days of hauling and lashing pay off. Your camp is now: ${SHELTERS[S.structure]}. It feels like something. +morale`, 'good');
  } else log(`A hard session of building. ${SHELTERS[S.structure+1]}: ${S.buildProg}/${need} done.`, 'good');
  afterAction('shelter');
}
// kit-draft §3.3: earth dugout - shovel-only shelter path, high labor, near-immune to storm damage,
// top-tier warmth retention. Independent of the tarp/lean-to/hut/timber ladder.
export function actDugout(){
  if (!hasKit('shovel') || S.dugout || S.dugoutProg >= DUGOUT_NEED) return;
  if (S.stock.wood < DUGOUT_COST.wood) return;
  if (!spend(DUGOUT_COST.e, DUGOUT_COST.h, true, 'ohw')) return;
  S.stock.wood -= DUGOUT_COST.wood;
  S.dugoutProg++;
  sfxBuild();
  if (S.dugoutProg >= DUGOUT_NEED){
    S.dugout = true;
    S.morale = clamp(S.morale + 10);
    log('The earth dugout is finished - dug deep, roofed over, banked with soil. The cold-country gambit pays off: this holds heat like nothing built above ground. +morale', 'good');
  } else log(`Another long session digging. ${S.dugoutProg}/${DUGOUT_NEED} done.`, 'good');
  afterAction('dugout');
}
export function actInsulate(){
  if (S.structure < 1 || S.insulation >= 3 || S.stock.moss < 4) return;
  if (!spend(6,1,true,'oh')) return;
  S.stock.moss -= 4; S.insulation++;
  sfxBuild();
  log(`You pack moss into every gap. Insulation ${S.insulation}/3.`, 'good');
  afterAction('insulate');
}
export function actFirepit(){
  if (S.firepitTier >= 2) return;
  const c = FIREPIT_COST[S.firepitTier+1];
  if (S.stock.rocks < c.rocks || (c.clay && S.stock.clay < c.clay)) return;
  if (!spend(c.e, c.h, true, 'ohw')) return;
  S.stock.rocks -= c.rocks; if (c.clay) S.stock.clay -= c.clay;
  S.firepitProg++;
  sfxBuild();
  const need = FIREPIT_NEED[S.firepitTier+1];
  if (S.firepitProg >= need){
    S.firepitTier++; S.firepitProg = 0;
    log(S.firepitTier===1 ? 'You set the stones in a tight ring. The rock holds heat - fires burn longer and hotter now.' : 'You line the pit with wet clay, fired hard by the coals. Heat holds even longer, and every stoke goes further.', 'good');
  } else log(`A long, heavy session on the firepit. ${S.firepitProg}/${need} done.`, 'good');
  afterAction('firepit');
}
export function actRack(){
  if (S.rackTier >= 2) return;
  const c = RACK_COST[S.rackTier+1];
  if (S.stock.wood < c.wood || (c.rocks && S.stock.rocks < c.rocks)) return;
  if (!spend(c.e, c.h, true, 'ohw')) return;
  S.stock.wood -= c.wood; if (c.rocks) S.stock.rocks -= c.rocks;
  S.rackTier++;
  sfxBuild();
  log(S.rackTier===1 ? 'A tripod rack stands over the fire pit. Meat can be smoked and kept.' : 'You weave a bark roof over the rack and stack stone at its base. It sheds rain, and it\'s a lot more work to get into now.', 'good');
  afterAction('rack');
}
export function actHugeRack(){
  if (S.hugeRack || S.rackTier < 1) return;
  const c = HUGE_RACK_COST;
  if (S.stock.wood < c.wood || S.stock.rocks < c.rocks) return;
  if (!spend(c.e, c.h, true, 'ohw')) return;
  S.stock.wood -= c.wood; S.stock.rocks -= c.rocks;
  S.hugeRack = true;
  sfxBuild();
  log(`A second, much bigger rack goes up beside the first - room to smoke a whole moose at once now. Capacity ${HUGE_RACK_CAP}. It runs entirely independently of the smaller rack.`, 'good');
  afterAction('hugeRack');
}
export function actCache(){
  if (S.cacheTier >= 3) return;
  const c = CACHE_COST[S.cacheTier+1];
  if ((c.wood && S.stock.wood < c.wood) || (c.rocks && S.stock.rocks < c.rocks) || (c.clay && S.stock.clay < c.clay)) return;
  if (!spend(c.e, c.h, true, 'ohw')) return;
  if (c.wood) S.stock.wood -= c.wood; if (c.rocks) S.stock.rocks -= c.rocks; if (c.clay) S.stock.clay -= c.clay;
  S.cacheProg++;
  sfxBuild();
  const need = CACHE_NEED[S.cacheTier+1];
  if (S.cacheProg >= need){
    S.cacheTier++; S.cacheProg = 0;
    const msg = S.cacheTier===1 ? 'A rock-and-timber cache, lid weighted with stone.' : S.cacheTier===2 ? 'You seal every seam with clay. Nothing is smelling its way in now.' : 'You raise the whole cache onto a timber platform, out of reach of anything on four legs.';
    log(msg, 'good');
  } else log(`A long, heavy session building the cache. ${S.cacheProg}/${need} done.`, 'good');
  afterAction('cache');
}
export function actIceCache(){
  if (S.iceCache || !S.winter || S.loc !== 'shore') return;
  if (!spend(ICE_CACHE_COST.e, ICE_CACHE_COST.h, true, 'ohw')) return;
  S.iceCacheProg++;
  sfxBuild();
  if (S.iceCacheProg >= ICE_CACHE_NEED){
    S.iceCache = true; S.iceCacheProg = 0;
    log('You cut and stack five ice blocks into a sealed cache in the frozen ground. Nothing living is getting through that. Your stores are finally, completely safe.', 'good');
  } else log(`You cut ice blocks and pack them into the cache pit. ${S.iceCacheProg}/${ICE_CACHE_NEED} done.`, 'good');
  afterAction('iceCache');
}
export function actJug(){
  if (!hasKit('pot')) return; // no reason to fire a water vessel if there's nothing to fill it for
  if (S.jug || S.stock.clay < TUNING.costs.jugClayNeed || S.fireH <= 0) return;
  if (!spend(8,1,false,'h')) return;
  S.stock.clay -= TUNING.costs.jugClayNeed; S.jug = true;
  sfxBuild();
  log('You shape a jug from wet clay and fire it hard in the coals. Your water storage just doubled.', 'good');
  afterAction('jug');
}
export function actBerryPicker(){
  if (S.berryPicker || S.stock.wood < 2) return;
  if (!spend(4,1,false,'h')) return;
  S.stock.wood -= 2; S.berryPicker = true;
  sfxBuild();
  log('You lash a long-handled picker from a forked branch. Foraging will go faster now.', 'good');
  afterAction('picker');
}
export function actFlute(){
  if (S.instrument || S.stock.wood < 1) return;
  if (!spend(6,1.5,false,'h')) return;
  S.stock.wood--; S.instrument = true;
  S.morale = clamp(S.morale + 5);
  sfxBuild();
  log('Careful knife-work on a length of dry willow. You put it to your lips - a thin, true note rises over the lake. +morale', 'good');
  afterAction('flute');
}
export function actMusic(){
  if (!S.instrument || S.playedToday) return;
  if (!spend(4,0.5,false)) return;
  S.morale = clamp(S.morale + 8); S.stress = clamp(S.stress - 10); S.playedToday = true;
  resolveDelta(3);
  S.tot.music++;
  log('You play until your fingers are cold - old songs, half-remembered. The dark feels smaller. +morale, −stress', 'good');
  afterAction('music');
}
export const FEAR_LABEL: any = {dark:'the dark', injury:'getting hurt out here', failing:'failing', empty:'going home with nothing'};
export const WHO_LABEL: any = {partner:'my partner', kid:'my kid', parent:'my mom', nobody:'anyone, really'};
/** Who is waiting at home, by name when the run has an authored cast (TAP / OUT text). */
export function whoLabel(fallback?){
  if (RULES.content && S.cast && S.backstory.who === 'partner') return S.cast.partner;
  return WHO_LABEL[S.backstory.who] || fallback;
}
export function actConfess(){
  if (S.over || S.confessedToday) return;
  if (!spend(2,0.5,false)) return;
  S.confessedToday = true; S.confessPrompt = false;
  S.lastConfessDay = S.day; S.daysSinceConfess = 0;
  const openers = ['Day '+S.day+'.', `Talking to this thing again.`, `Not sure who ever actually watches these back.`, `Camera's rolling, so - here goes.`];
  const stateLines = [];
  if (S.hunger < 30) stateLines.push(`I'm hungry in a way that doesn't really go away anymore.`);
  if (S.warmth < 35) stateLines.push(`Been cold pretty much since I woke up.`);
  if (S.morale > 70) stateLines.push(`Honestly - feeling good today. Don't want to jinx it.`);
  if (S.morale < 30) stateLines.push(`Not going to pretend today was fine. It wasn't.`);
  if (S.injury) stateLines.push(`This ${S.injury.type} is really slowing me down.`);
  if (S.lastKillDay === S.day) stateLines.push(`Took an animal today. Still sitting with that.`);
  if (S.tot.raids > 0 && rand()<0.3) stateLines.push(`${S.martenNamed} is getting bolder. I half-respect it at this point.`);
  if (!stateLines.length) stateLines.push(`Nothing dramatic today. Just the work.`);
  const closers = [
    `Doing this for ${whoLabel('anyone, really')}, when it comes down to it.`,
    `Some days ${FEAR_LABEL[S.backstory.fear]||'the fear'} feels closer than others. Today it was close.`,
  ];
  const text = `${pick(openers)} ${pick(stateLines)} ${pick(closers)}`;
  S.confessionals.push({day:S.day, text});
  const dm = 3 + Math.floor(rand()*4);
  S.morale = clamp(S.morale + dm); S.stress = clamp(S.stress - 5);
  resolveDelta(hasTrait('haunted') ? 6 : 3);
  log(`🎥 "${text}" (+${dm} morale, −5 stress)`, 'good');
  afterAction('confess');
}
export function actTreeMark(){
  if (S.over || S.treeMarkedToday) return;
  if (!spend(1,0.0833,false)) return;
  S.treeMarkedToday = true;
  S.treeMarkStreak = (S.treeMarkStreak||0) + 1;
  S.lastTreeMarkDay = S.day;
  resolveDelta(hasTrait('spiritual') ? 2 : 1);
  log(`You cut day ${S.day} into the post by the fire. Small thing. Feels like something, still.`, 'good');
  afterAction('treemark');
}
export function actChair(){
  if (S.chair || S.stock.wood < 3) return;
  if (!spend(6,1,false,'h')) return;
  S.stock.wood -= 3; S.chair = true;
  sfxBuild();
  log('A real chair, lashed and solid. Sitting like a human being again is worth every splinter. (+comfort)', 'good');
  afterAction('chair');
}
export function actTable(){
  if (S.table || S.stock.wood < 3) return;
  if (!spend(6,1,false,'h')) return;
  S.stock.wood -= 3; S.table = true;
  sfxBuild();
  log('A slab table by the fire. Somewhere to gut fish that isn\'t your knee. (+comfort)', 'good');
  afterAction('table');
}
export function actBed(){
  if (S.bed || S.stock.moss < 4) return;
  if (!spend(5,1,false,'h')) return;
  S.stock.moss -= 4; S.bed = true;
  sfxBuild();
  log('A deep bough-and-moss bed off the cold ground. Tonight might actually be sleep. (+comfort)', 'good');
  afterAction('bed');
}
export function restEfficiency(){ return Math.max(0.55, 1 - (S.day-1)*0.044); } // compression: efficiency decay doubled to land the same by run's end
export function actRest(){
  if (!spend(0,1,false,'')) return;
  const comfort = (S.chair?1:0)+(S.table?1:0)+(S.bed?1:0);
  let gain;
  if (S.restsToday < 2){
    const base = (S.fireH > 0 && S.loc === 'camp' ? 10 : 6) + comfort*2;
    gain = Math.round(base * restEfficiency());
  } else {
    gain = 3;
  }
  S.energy = clamp(S.energy + gain, 0, S.maxEnergy);
  S.stress = clamp(S.stress - 3);
  S.restsToday++;
  if (S.fireH <= 0 || S.loc !== 'camp') S.warmth = clamp(S.warmth + 4);
  if (S.loc === 'camp' && S.fireH > 0) tickShiverClear(1);
  log(`You rest${S.loc==='camp'&&S.fireH>0?' by the fire':''}. +${gain} energy${S.restsToday>2?' - running on fumes now':` (${S.restsToday}/2 today)`}`, 'good');
  afterAction('rest');
}
export const SIT_WATCH_POOL: any = [
  'You sit still and let the place do the talking for a while.',
  'A dragonfly works the air in front of you, indifferent to your patience.',
  'The wind moves through without you in its way for once.',
  'You watch a shadow cross the ground and don\'t bother naming what cast it.',
  'Nothing happens, and for a few minutes that\'s exactly enough.',
  'A branch creaks somewhere behind you. You don\'t turn around.',
  'You count your own breaths until you lose interest in counting.',
  'The light shifts half a degree and you actually notice it.',
  'Something small rustles in the leaf litter and goes still when you go still.',
  'You watch clouds do the one thing clouds do.',
  'A beetle crosses the toe of your boot like you\'re part of the landscape now.',
  'The quiet has a texture to it, if you sit in it long enough.',
  'You notice how loud your own heartbeat sounds when nothing else is competing for it.',
  'A gust moves through the canopy in one long wave, then it\'s gone.',
  'You watch your own breath fog and disappear, over and over.',
  'For a while you just watch the water, or the trees, or nothing at all.',
  'A spider works methodically at something between two branches.',
  'You let your eyes go soft and stop trying to be useful for a minute.',
  'The stillness asks nothing of you, which is rare enough to notice.',
  'You hear your own name in the wind, or think you do, and let it go.',
  'A leaf lets go overhead and takes its time getting to the ground.',
  'You watch the light change on the water without deciding what it means.',
  'Something distant calls once and isn\'t answered.',
  'You sit with your hands still for the first time in what feels like days.',
  'The cold finds the back of your neck and you let it.',
  'A chickadee lands close, decides you\'re not interesting, and leaves.',
  'You watch your own shadow lengthen without moving to match it.',
  'The world keeps doing its business without checking in with you, and that\'s oddly restful.',
  'You notice how many different shades of green there actually are out here.',
  'A branch you\'ve looked at fifty times finally looks different today.',
  'You listen to the specific silence of no wind at all.',
  'Steam lifts off something nearby and you watch it go until it\'s gone.',
  'You sit long enough to stop performing patience and just have it.',
  'A single bird call answers itself twice, then stops.',
  'You watch the far treeline like it might do something. It doesn\'t. That\'s fine.',
  'The ground under you holds still in a way nothing else out here does.',
  'You let the cold and the quiet just be facts for a minute, not problems.',
  'Something moves at the very edge of what you can see and resolves into nothing.',
  'You sit with the weight of the day and set it down, briefly, on purpose.',
  'The place goes on without you, exactly as it would if you weren\'t watching.',
];
export function actSitWatch(){
  if (S.over) return;
  if (!spend(0, 0.5, false, '')) return;
  S.sitsToday = (S.sitsToday||0) + 1;
  const fresh = S.sitsToday <= 2;
  let msg;
  if (!fresh){
    msg = 'You sit a while longer, but the stillness has already said what it had to say today.';
  } else {
    const gain = hasTrait('restless') ? 0 : 1;
    S.morale = clamp(S.morale + gain);
    msg = pick(SIT_WATCH_POOL) + (gain ? ' +1 morale' : say(' (not really his thing)', ' (not really your thing)'));
    if (rand() < 0.15){
      if (S.loc === 'shore' && S.shoreSpots.length){
        const sp = pick(S.shoreSpots); sp.noLuck = Math.max(0, sp.noLuck - 2);
        msg += ' Fish rising out there - worth remembering.';
      } else if (S.loc === 'woods'){
        if (S.hunt.state === 'none'){ S.hunt = {state:'tracks', day:S.day, species:''}; msg += ' Movement across the clearing - fresh sign, worth following.'; }
        else msg += ' Something moves far off and is gone before you place it.';
      } else {
        msg += ' The air already has tomorrow\'s weather in it, if you know how to read it.';
      }
    }
  }
  log(msg, 'good');
  afterAction('sitwatch');
}
export function teethTierForStreak(n?){
  if (n >= TUNING.teeth.tier3Days) return 3;
  if (n >= TUNING.teeth.tier2Days) return 2;
  if (n >= TUNING.teeth.tier1Days) return 1;
  return 0;
}
export function clearTeethProgress(){ S.conditions.teeth.quietDays = (S.conditions.teeth.quietDays||0) + 1; }
export function eatCooked(){
  if (S.over || !S.cookedMeal) return;
  if (cookedMealSpoiled()){ confirmEatSpoiled('cooked'); return; }
  doEatCooked();
}
export function maybeCrackTooth(){
  if (S.chains.tooth) return;
  if (activeChainCount() >= (S.day>10?2:1)) return;
  if (rand() < 0.035){
    S.chains.tooth = {day:S.day, severity:1};
    log('Something hard - bone, grit, a pellet - meets your tooth wrong. Sharp pain, right to the root.', 'bad');
  }
}
export function doEatCooked(){
  S.cookedMeal = null;
  S.hunger = clamp(S.hunger + 28); S.energy = clamp(S.energy+3,0,S.maxEnergy); S.morale = clamp(S.morale+2);
  resolveDelta(2);
  S.kcal += 1300; S.kcalIntake += 1300;
  S.consecutiveSmokedOnlyDays = 0;
  clearTeethProgress();
  log(pick(EAT_COOKED) + ' +28 hunger', 'good');
  S.mealsToday++; S.tot.meals++;
  sfxEat();
  maybeCrackTooth();
  render();
}
export function eatSmoked(){
  if (S.over || S.smoked<=0) return;
  const {contaminated} = takeSmoked(1);
  S.hunger = clamp(S.hunger + 16); S.energy = clamp(S.energy+2,0,S.maxEnergy);
  S.kcal += 600; S.kcalIntake += 600;
  S.mealsHadOnlySmokedToday = true;
  log(pick(EAT_SMOKED) + ' +16 hunger', 'good');
  S.mealsToday++; S.tot.meals++;
  sfxEat();
  maybeCrackTooth();
  if (contaminated && rand() < 0.75){
    triggerMedicalArc('badMeat');
    log('That batch was smoked from meat already turning - your gut makes you pay for it now.', 'bad');
  }
  render();
}
export function eatBerries(){
  if (S.over || berryCount()<=0) return;
  if (oldestBerriesSpoiled()){ confirmEatSpoiled('berries'); return; }
  doEatBerries();
}
export function doEatBerries(){
  takeBerries(1);
  S.hunger = clamp(S.hunger + 10); S.energy = clamp(S.energy+3,0,S.maxEnergy); S.morale = clamp(S.morale+2);
  S.kcal += 80; S.kcalIntake += 80;
  S.consecutiveSmokedOnlyDays = 0;
  clearTeethProgress();
  log(pick(EAT_BERRIES) + ' +10 hunger', 'good');
  S.mealsToday++; S.tot.meals++;
  sfxEat();
  render();
}
// LEG-002: v12 drafts 'Rations (8 uses)' but never implemented them. Each use: +20 hunger and a
// small morale tick, as the draft card promises. They don't spoil.
export function rationsLeft(){
  if (!RULES.rations || !hasKit('rations')) return 0;
  return S.rations ?? RATIONS.uses;
}
export function eatRation(){
  if (S.over || rationsLeft() <= 0) return;
  S.rations = rationsLeft() - 1;
  S.hunger = clamp(S.hunger + RATIONS.hunger); S.energy = clamp(S.energy+RATIONS.energy,0,S.maxEnergy); S.morale = clamp(S.morale+RATIONS.morale);
  S.kcal += RATIONS.kcal; S.kcalIntake += RATIONS.kcal;
  S.consecutiveSmokedOnlyDays = 0;
  clearTeethProgress();
  log(`🥫 You tear open a ration pack and make it last. ${S.rations} left. +${RATIONS.hunger} hunger`, 'good');
  S.mealsToday++; S.tot.meals++;
  sfxEat();
  render();
}
export function confirmEatSpoiled(kind?){
  const label = kind==='cooked' ? 'This meal has been sitting too long and has turned.' : 'These berries have gone past safe - soft, sour, wrong.';
  showModal(`<h3>Risky food</h3><div class="wsub">${label} Eating it could cost you 2-3 days of sickness. Is it worth it?</div>
    <button class="mbtn" onclick="hideModal(); eatSpoiledAnyway('${kind}')">Eat it anyway</button>
    <button class="mbtn ghost" onclick="hideModal(); discardSpoiled('${kind}')">Throw it out</button>`);
}
export function eatSpoiledAnyway(kind?){
  if (kind==='cooked') doEatCooked(); else doEatBerries();
  spoilageSting();
  if (rand() < 0.65) triggerMedicalArc('badMeat');
}
export function discardSpoiled(kind?){
  spoilageSting();
  if (kind==='cooked'){ S.cookedMeal = null; registerWasteDiscard(2); log('You toss the spoiled meal. Better than being sick for it. −morale, +stress', 'sys'); }
  else { const n = discardSpoiledBerries(); registerWasteDiscard(n); log(`You toss ${n} spoiled berries. −morale, +stress`, 'sys'); }
  render();
}
export function actDrink(){
  if (S.over || S.water <= 0) return;
  S.water--;
  S.thirst = clamp(S.thirst + 32);
  sfxDrink();
  log(pick(DRINK_LINES) + ' +32 thirst', 'good');
  render();
}

