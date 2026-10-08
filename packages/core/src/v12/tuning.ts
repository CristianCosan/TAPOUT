// Ported from legacy/tap-out-v12.html (lines 693-1060). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { rand } from './runtime.ts';
import { weightLossPct } from './cost.ts';
import { meatCount } from './food.ts';
import { clamp, pick } from './helpers.ts';
import { S } from './state.ts';
// ============================== v12 §0/compression: RUN_SCALE ==============================
// The parked compression migration, applied per v12 §0: modifies only day-count/pacing constants -
// §3's weather/temperature/photoperiod system (below) owns temperature and night length entirely and
// wins any disagreement with the original compression plan's own weather assumptions. RUN_SCALE is the
// single master constant; halving it (56 -> 28) compresses every calendar-keyed schedule below by half
// while leaving day-texture (action costs, energy, spoilage timers, catch rates, warmth/hour) untouched.
export const RUN_SCALE = 28; // v12: compressed run, ends ~day 25-30 (was ~50-60 at RUN_SCALE=56)
export const RUN_SCALE_FACTOR = RUN_SCALE / 28; // 1.0 at the new compressed baseline; the photoperiod formulas above are tuned directly to this baseline

// ============================== v8 §3: THE TUNING OBJECT (single source of truth) ==============================
export const TUNING: any = {
  energy: {
    startArrival: 180,
    taperD6: 160, taperD7: 140,
    baselineFromD8: 120,
    schedule: [[7,180],[8,160],[9,140],[Infinity,120]],
  },
  buildCosts: {
    hutEnergyPerSession: 22,
  },
  catchRates: {
    snareSpotQ: [0.40, 0.55, 0.72, 0.88, 0.97],
    lineSpotQ:  [0.62, 0.80, 0.93, 0.98],
    netMultiplier: 1.3,
    pityThresholdDays: 2,
    pityMultiplierStep: 0.5,
    pityMultiplierCap: 3.0,
    postSnowSnareDaysPerCatch: 4.5,
  },
  // v12 §3: temperature is the single source of truth for weather - the whole group is rebuilt.
  temperature: {
    day1Lo: 12, day1Hi: 16,          // §3.1 day-1 band
    dailyDescentNoise: 2.5,           // small daily noise on the descent curve
    hardHighByDay11: 5,               // hard rule: daily high <=5C by day 11
    zeroCrossDayLo: 12, zeroCrossDayHi: 18,  // §3.1: zero-cross day Z rolled in [12,18]
    postCrossFloorDay: 13,            // Z+12..Z+15 -> floor reached; midpoint used for the curve
    floorTemp: -20,                   // hard floor, never colder than this (oscillates -12..-20 after)
    oscillationBand: 4,               // +/- band once at the floor
    postFreezeMultiplier: 1.5,        // legacy multiplier, still used by outdoor warmth drain post-cross
    arrivalFitnessBuffer: 20,
  },
  depletion: {
    hungerPerHourDay: 1.4, thirstPerHourDay: 1.8,
    hungerPerHourNight: 0.85, thirstPerHourNight: 1.0,
    healthDrainHunger: 0.45, healthDrainThirst: 0.8, healthDrainWarmth: 0.26,
    // v12 §4.3: overnight soaked/shivered-all-night penalties tripled (was 1/3).
    overnightHealthHungerCrit: 3, overnightHealthThirstCrit: 4, overnightHealthWarmthCrit: 9,
    overnightHealthWarmthLow: 1, overnightHealthWet: 3, overnightHealthSick: 2,
  },
  resolve: {
    dreadDrainPerCondition: 0.28,
  },
  medic: {
    noPullBeforeDay: 5,               // compression: was 10 at RUN_SCALE=56, halved
    catastrophicHealth: 15,
    day7WarningOnly: true,
    forcedPullWeightLossPct: 0.27,     // v12 §12 re-tune: 0.24->0.27 - v12's new hardship stack (shivering, tripled overnight penalties) was pulling med-cause over its v11-calibrated band
    severeHealthThreshold: 15,          // v12 §12 re-tune: 22->15 - was the dominant OR-branch in the weekly "severe" pull check; health now crashes faster under shivering/tripled overnight penalties, so the old bar of 22 was being crossed far more often than in v11. (Tried 18 as a middle value: raised the total health-related loss share and left two metrics marginally over instead of one - 15 gives the cleaner profile, med+tap in band, only dead elevated.)
    bmiPullThreshold: 17.5, bmiWarnThreshold: 18.5,
  },
  bigGame: {
    signDroughtDays: 8,
    signDroughtWeightStep: 0.02,
  },
  seedFloors: {
    minFishingQ: 0.20,
    minWoodNodesOk: true,
  },
  costs: {
    woodCampMin: 30,
    fetchWaterMin: 5, fetchWaterE: 3,
    tinderMin: 5, tinderYieldLo: 3, tinderYieldHi: 4,
    forageMin: 15, forageE: 3,
    mossMin: 15, mossE: 6,
    clayMin: 10,
    rocksMin: 10,
    scoutE: 9,
    firepitClayLineHr: 1, firepitClayLineE: 12,
    jugClayNeed: 3,
    haulLoadedMin: 30, haulLoadedE: 10,
    haulUnloadedMin: 30, haulUnloadedE: 3,
    smokeRackWood: 1, smokeRackTinder: 1,
    smokeHugeRackWood: 2, smokeHugeRackTinder: 1,
    // v12 §10.3: tracking energy halved - actFollow/actTrail/night follow-the-noise options.
    followBaseE: 4, trailBaseE: 3,
  },
  night: {
    hardCapHour: 30,
    startHour: 21,
    timeMultiplier: 1.3,
    stressPerHour: 1.5,
    stressPerHourFireLit: 0.75,
    injuryChanceMultiplier: 2,
    debtPerHourPastMidnight: 1,
    sightUselessMultiplier: 0.12,
    sleepHours: 6,
  },
  postSnow: {
    travelTimeMultiplier: 1.5,
    actionEnergyMultiplier: 1.25,
  },
  outdoorWarmthDrain: {
    tier1PerHour: 2, tier1Hours: 2,
    tier2PerHour: 4, tier2Hours: 2,
    tier3PerHour: 6,
    rainMultiplier: 2,
  },
  exposure: {
    perRainHour: 1, perColdHour: 0.5,
    soakedThreshold: 3.5,
    dryHoursNeeded: 3,
    soakedWarmthCap: 70,
    coldChance: 0.35,
    coldDurationDays: [4,5],
  },
  // v12 §4.1: Shivering - any cold/wet tag active (Soaked, Soaked Through, a Cold) multiplies time 1.5x
  // and energy 2x, stacking multiplicatively with injury multipliers. Cleared by ~3-4 cumulative fire-rest hours.
  shivering: {
    timeMul: 1.5, energyMul: 2.0,
    clearHoursNeeded: 3.5,
  },
  food: {
    passiveCutMultiplier: 0.5,
    smokedShelfHoursAboveZero: 108,
    unsmokedShelfHoursBelowZero: 84,
    snareDeathSpoilHours: 24,
    monotonyDays: 3,
    wasteEventThreshold: 10,
    saltMoldMultiplier: 3,            // kit-draft §3.5: salt triples smoked-food shelf life
  },
  teeth: {
    tier1Days: 2, tier2Days: 4, tier3Days: 6,
  },
  kit: {
    lineStockTotal: 12,
    wireStockTotal: 40,
    lineWorryThreshold: 3,
    wireWorryThreshold: 8,
    // kit-draft §5.1: halve breakage EXPOSURE not stock (raise per-event loss chance instead) - not
    // used this version since day-texture catch/breakage rates are explicitly parked per v12 §0.
  },
  body: {
    sensitivityAtStart: 1.0, sensitivityAtDay50: 1.5,
  },
  cards: {
    maxPerDay: 3, minGapHours: 3,
    heavyCooldownDays: 5,
  },
  // v12 §6: severe injury run-threatening. Ankle-specific multiplier table (replaces the old blanket 1.5x).
  ankle: {
    travelMul: 3.5, woodMul: 3.5, physicalMul: 3.0, cookBoilMul: 1.1,
  },
};

export const WEATHER: any = {
  clear:    {icon:'☀️', label:'Clear',     dayDrain:2.0, nightDrain:2.8, fireChance:0.92, wetGain:0,  slip:0},
  overcast: {icon:'☁️', label:'Overcast',  dayDrain:2.4, nightDrain:3.4, fireChance:0.85, wetGain:0,  slip:0},
  rain:     {icon:'🌧', label:'Rain',      dayDrain:3.4, nightDrain:4.4, fireChance:0.70, wetGain:8,  slip:0.05},
  cold:     {icon:'❄️', label:'Cold snap', dayDrain:4.6, nightDrain:6.0, fireChance:0.80, wetGain:0,  slip:0.02},
  snow:     {icon:'🌨', label:'Snow',      dayDrain:5.0, nightDrain:6.6, fireChance:0.70, wetGain:5,  slip:0.05},
  storm:    {icon:'⛈', label:'Storm',     dayDrain:5.6, nightDrain:7.0, fireChance:0.55, wetGain:13, slip:0.08},
};
// v12 kit-draft §1/§2/§3: 17-item pool (10 standard + 7 optional), pick exactly 10. Standard 10 remain
// the default (one click keeps it). Each item's "without it" consequence is wired through S.kit (a
// Set of drafted item ids) checked at the relevant action sites below.
export const KIT_POOL: any = [
  {id:'axe', label:'Axe', std:true, icon:'🪓', has:'fell/split logs; wood-work at full speed', without:'no felling - log harvest only via saw or shovel'},
  {id:'saw', label:'Saw', std:true, icon:'🪚', has:'bucks logs fast; +axe = -20% all wood-work time', without:'slower log work if axe-only'},
  {id:'pot', label:'Cooking pot', std:true, icon:'🍲', has:'boil water, cook meals', without:'no boiling until a clay jug is fired; cooking primitive (spit only, no meals)', expert:true},
  {id:'bag', label:'Sleeping bag', std:true, icon:'🛏', has:'survivable nights at low shelter tiers', without:'brutal nights until moss bed + shelter tier 2; heavy early warmth drain', expert:true},
  {id:'ferro', label:'Ferro rod', std:true, icon:'🎇', has:'reliable fire in minutes', without:'friction fire only - slow, weather-dependent, morale sting per fail', expert:true},
  {id:'bow', label:'Bow & 9 arrows', std:true, icon:'🏹', has:'the hunting arm', without:'no hunting - snare/fish/forage run; big game is scenery'},
  {id:'line', label:'Fishing line (12)', std:true, icon:'🎣', has:'set passive fishing lines', without:'no lines - net-only fishing, if drafted/woven'},
  {id:'wire', label:'Snare wire (40)', std:true, icon:'➰', has:'durable snares', without:'no snares, period'},
  {id:'mace', label:'Bear mace', std:true, icon:'🧴', has:'the spray option in every predator encounter', without:'predator cards lose the mace option - only voice, fire, and walls'},
  {id:'multitool', label:'Multi-tool', std:true, icon:'🔧', has:'fine work at baseline speed', without:'setting lines/traps takes +25% time; small penalties on gear repairs'},
  {id:'net', label:'Gill net (ready-made)', std:false, icon:'🕸', has:'skip the 10h weave entirely - deploy day one', without:'must weave a net from scratch if wanted'},
  {id:'knife', label:'Hunting knife', std:false, icon:'🔪', has:'carving animals, cooking, smoking prep ~25% faster', without:'no speed bonus on carving/cooking/smoking'},
  {id:'shovel', label:'Shovel', std:false, icon:'⛏', has:'crude axe (+30% time) AND unlocks the earth dugout shelter', without:'no dugout path'},
  {id:'rations', label:'Rations (8 uses)', std:false, icon:'🥫', has:'each use restores 20 hunger + a small morale tick', without:'no ration buffer for the arrival week'},
  {id:'salt', label:'Salt', std:false, icon:'🧂', has:'smoked meat lasts 3x longer, teeth-debuff advances at half speed', without:'no preservation boost'},
  {id:'tarp', label:'Heavy-duty second tarp', std:false, icon:'⛺', has:'less rain/wind warmth-drain at camp, shelter -1 session, storms hit the tarp first', without:'no extra storm protection'},
  {id:'soap', label:'Bar of soap', std:false, icon:'🧼', has:'daily morale trickle when used; cut/bite infection chance meaningfully reduced', without:'no hygiene buffer against infection'},
];
export const KIT = KIT_POOL.map(k => [k.icon, k.label, k.has]); // legacy shape kept for any leftover references
export const RIVAL_NAMES: any = ['Dub','Timber','William','Roland','Jordan','Callie','Clay','Lucas','Britt'];
export const GAME: any = {
  hare:      {meat:2,  tier:'small',  label:'a hare'},
  fatHare:   {meat:3,  tier:'small',  label:'a fat hare'},
  squirrel:  {meat:1,  tier:'small',  label:'a squirrel'},
  grouse:    {meat:2,  tier:'small',  label:'a grouse'},
  fatGrouse: {meat:3,  tier:'small',  label:'a fat grouse'},
  duck:      {meat:2,  tier:'small',  label:'a duck'},
  beaver:    {meat:8,  tier:'medium', label:'a beaver'},
  wolverine: {meat:10, tier:'medium', label:'a wolverine'},
  deer:      {meat:32, tier:'big',    label:'a deer'},
  moose:     {meat:72, tier:'big',    label:'a moose'},
};
export const SMALL_GAME_TABLE: any = [['hare',.75],['fatHare',.25]];
export const HUNT_SPECIES_TABLE: any = [['beaver',.16],['wolverine',.10],['deer',.58],['moose',.16]];
export function rollSmallGame(){ const r=rand(); let acc=0; for(const [k,p] of SMALL_GAME_TABLE){ acc+=p; if(r<acc) return k; } return 'hare'; }
export function rollHuntSpecies(){ const r=rand(); let acc=0; for(const [k,p] of HUNT_SPECIES_TABLE){ acc+=p; if(r<acc) return k; } return 'deer'; }
export const FISH_SIZES: any = [['small',1,.35],['medium',2,.30],['big',3,.20],['huge',4,.10],['humongous',5,.05]];
export function rollFish(){ const r=rand(); let acc=0; for(const [name,meat,p] of FISH_SIZES){ acc+=p; if(r<acc) return {name,meat}; } return {name:'small',meat:1}; }
// v12 kit-draft §2: wood splits into logs (building material, requires axe/saw/shovel) and firewood
// (hand-gatherable always, no tool needed). CARRY_CAP.wood now governs logs; firewood shares no cap
// (it's a camp/hand-carry resource tracked directly in S.stock.firewood, gathered via actFirewood()).
export const CARRY_CAP: any = {wood:6, rocks:5, moss:6, clay:6};
export function carryType(){
  for (const k of ['wood','rocks','moss','clay']) if (S.carry[k] > 0) return k;
  return null;
}
export function carryBlocked(type?){
  const cur = carryType();
  return cur && cur !== type;
}
export const MEAT_HAUL_CAP = 12;
export const TAP_REASONS: any =['missed their family too much','lost their shelter in a storm','was pulled at a medical check',`couldn't find enough food`,'rolled an ankle on the shoreline',`couldn't take the silence anymore`,'burned through their firewood in a cold snap','woke to wolves in their camp and quit on the spot'];
export function contextualTapReason(){
  const pool = [];
  if (S.injury) pool.push(`medical pull - ${S.injury.type==='leg'?'a bad ankle, same as yours':'an infected hand, same as yours'}`);
  if ((meatCount()+S.smoked) <= 0 && S.hunger < 35) pool.push(`couldn't find enough food - you know the feeling`);
  if (S.warmth < 30) pool.push(`hypothermia scare, pulled by medical`);
  if (S.morale < 30) pool.push('missed their family too much');
  if (S.stress > 70) pool.push(`couldn't take the silence anymore`);
  if (S && S.startWeight && weightLossPct() > 0.12) pool.push('medical pull - the weight came off too fast, same as you');
  if (pool.length && rand() < 0.6) return pick(pool);
  return pick(TAP_REASONS);
}
export const SHELTERS: any = ['Tarp on the ground','Lean-to','Framed hut','Timber shelter'];
export const BUILD_NEED: any = [2,3,5];
export const SHELTER_COST: any = [
  {e:12,h:1.5,wood:5},
  {e:TUNING.buildCosts.hutEnergyPerSession,h:4,wood:5,moss:2},
  {e:24,h:4,wood:6,moss:2,clay:2,rocks:3}, // v12 §10.2: shelter final-stage energy 34 -> 24
];
export const FIREPIT_NEED: any = [null, 1, 2];
export const FIREPIT_COST: any = [null, {e:14,h:3,rocks:6}, {e:TUNING.costs.firepitClayLineE,h:TUNING.costs.firepitClayLineHr,rocks:4,clay:3}];
export const RACK_COST: any    = [null, {e:8,h:1.5,wood:4}, {e:10,h:2,wood:3,rocks:3}];
export const HUGE_RACK_COST: any = {e:20,h:4,wood:8,rocks:4};
export const HUGE_RACK_CAP = 12;
export const RACK_CAP: any = [0, 6, 6];
export const CACHE_NEED: any   = [null, 2, 2, 3];
export const CACHE_COST: any   = [null, {e:14,h:3,wood:5,rocks:4}, {e:15,h:3,rocks:3,clay:3}, {e:16,h:3,wood:6,rocks:2}];
export const ICE_CACHE_NEED = 2;
export const ICE_CACHE_COST: any = {e:16,h:4};
// kit-draft §3.3: earth dugout - shovel-only shelter path, high labor, near-immune to storm damage.
export const DUGOUT_NEED = 4;
export const DUGOUT_COST: any = {e:26,h:4,wood:2};
export const ENERGY_SCHEDULE: any = [[3,120],[6,110],[9,100],[11,90],[15,80],[20,70],[25,60],[31,55],[38,50],[50,45],[65,40],[74,35],[89,30],[Infinity,20]];
export function maxEnergyForDay(day?){
  if (day <= 5) return TUNING.energy.startArrival;
  if (day === 6) return TUNING.energy.taperD6;
  if (day === 7) return TUNING.energy.taperD7;
  for (const [upTo,val] of ENERGY_SCHEDULE) if (day<=upTo) return Math.min(val, TUNING.energy.baselineFromD8);
  return 20;
}
export function computeMaxEnergy(){
  const base = maxEnergyForDay(S.day);
  const avgMeals = S.mealsHistory.length ? S.mealsHistory.reduce((a,b)=>a+b,0)/S.mealsHistory.length : 0;
  let mod = 0;
  if (avgMeals >= 2) mod += 4;
  else if (avgMeals >= 1) mod -= 4;
  else mod -= 14;
  if (S.morale < 30) mod -= 6;
  if (S.stress > 65) mod -= 6;
  if (S.warmth < 30) mod -= 4;
  if (S.day <= 5){ return clamp(Math.round(base + mod), 130, 180); }
  const weightMul = clamp(1 - 1.5*weightLossPct(), 0.35, 1);
  return clamp(Math.round((base + mod) * weightMul), 20, 130);
}
export const EAT_COOKED: any = ['A real cooked meal - hot, filling, seasoned with whatever grows nearby. It almost tastes like a kitchen.','You eat a proper meal off the fire, sitting down like a person again.'];
export const EAT_BERRIES: any = ['A handful of berries and greens, eaten on the move.','You eat the forage raw - quick, easy, a little sour.','You pick through what you gathered and eat what looks safest, right there.'];
export const EAT_SMOKED: any = ['Smoked rations. Chewy, but they keep you going.','You gnaw a strip of smoked meat from the rack.'];
export const DRINK_LINES: any = ['Clean water. You feel it everywhere.','You drink deep from the pot.','Warm boiled water - better than nothing.'];
export const SENSORY_POOL: any = [
  {loc:'camp', text:"The fire ring, the shelter, everything you have."},
  {loc:'camp', text:"Smoke curls straight up this morning - dead calm."},
  {loc:'camp', text:"Camp smells like woodsmoke and damp canvas."},
  {loc:'camp', cond:()=>S.weather==='rain', text:"Rain taps steady on whatever's over your head."},
  {loc:'camp', cond:()=>S.weather==='storm', text:"The wind is testing every seam in the shelter."},
  {loc:'camp', cond:()=>S.weather==='snow', text:"Snow ticks softly against the tarp, building at the edges."},
  {loc:'camp', cond:()=>S.weather==='clear', text:"Clean light on the water this morning - the kind you'd photograph, if you still had that instinct."},
  {loc:'camp', cond:()=>S.hour<9, text:"Frost silvers the grass around the fire ring."},
  {loc:'camp', cond:()=>S.hour>=20, text:"The dark presses right up to the edge of the firelight and stops there."},
  {loc:'camp', cond:()=>S.fireH>0, text:"The fire pops and settles, doing its one job."},
  {loc:'camp', cond:()=>S.fireH<=0, text:"The cold pit looks bigger without flame in it."},
  {loc:'camp', cond:()=>S.winter, text:"Everything at camp has a hard, white edge to it now."},
  {loc:'camp', cond:()=>!S.winter && S.day>15, text:"The grass around camp is worn to dirt in all your usual paths."},
  {loc:'camp', text:"A raven works the treeline past the shelter, unbothered by you."},
  {loc:'camp', text:"The woodpile is smaller than you remember it looking yesterday."},
  {loc:'camp', cond:()=>S.structure>=2, text:"The walls hold the wind out better than you expected, most days."},
  {loc:'camp', cond:()=>S.structure<1, text:"The tarp snaps once, hard, and you flinch before you can stop yourself."},
  {loc:'camp', cond:()=>S.wet>50, text:"Everything within reach feels faintly damp to the touch."},
  {loc:'camp', text:"You can hear the lake from here if you stop moving long enough."},
  {loc:'camp', cond:()=>S.morale>75, text:"For a minute the whole camp looks almost like a place you chose, not just landed in."},
  {loc:'camp', cond:()=>S.morale<30, text:"Camp looks smaller today. Every camp does, eventually."},
  {loc:'camp', text:"Somewhere off in the trees, something moves and then doesn't again."},
  {loc:'camp', cond:()=>S.hour>=18 && S.hour<21, text:"The light's going gold and then gray, the way it does right before it just goes."},
  {loc:'camp', text:"The ash pit smells like every fire you've ever built here, all at once."},
  {loc:'shore', text:"Flat calm. The lake gives nothing away."},
  {loc:'shore', text:"Gull-picked fish bones scattered on the stones."},
  {loc:'shore', text:"An otter slide carves down the far bank."},
  {loc:'shore', text:"Raven tracks stitched along the waterline."},
  {loc:'shore', cond:()=>S.weather==='rain', text:"Rain dimples the whole surface of the lake at once."},
  {loc:'shore', cond:()=>S.weather==='storm', text:"Whitecaps out past the point - nobody's fishing that today."},
  {loc:'shore', cond:()=>S.weather==='clear', text:"The lake is glass this morning."},
  {loc:'shore', cond:()=>S.weather==='cold', text:"A skin of mist sits low over the water, not moving."},
  {loc:'shore', cond:()=>S.winter, text:"Ice groans somewhere out past the shallows, settling."},
  {loc:'shore', cond:()=>!S.winter && S.hour>=18 && S.hour<21, text:"Smoke hangs low over the water - rain before dark, probably."},
  {loc:'shore', cond:()=>S.hour<9, text:"Steam lifts off the water where the sun hasn't reached yet."},
  {loc:'shore', text:"A heron stands dead still at the shallows, waiting on something patient."},
  {loc:'shore', text:"The shoreline smells like cold mud and old fish."},
  {loc:'shore', cond:()=>S.day>20, text:"The waterline has crept a little further out than when you first got here."},
  {loc:'shore', text:"Wind combs a long ripple across the whole lake, then lets it go."},
  {loc:'shore', cond:()=>S.hour>=18 && S.hour<21, text:"The water's gone the color of the sky, which is going the color of nothing."},
  {loc:'shore', text:"Somewhere out past the point, a fish breaks the surface once."},
  {loc:'shore', cond:()=>S.morale>75, text:"You could stand here a while and not mind it at all."},
  {loc:'woods', text:"Old scat, days cold. Nothing moving."},
  {loc:'woods', text:"A squirrel scolds you from a spruce. Otherwise, still."},
  {loc:'woods', text:"Wind in the timber. No fresh sign."},
  {loc:'woods', text:"Chewed bark, but nothing recent."},
  {loc:'woods', cond:()=>S.weather==='rain', text:"The canopy holds most of the rain back, for now."},
  {loc:'woods', cond:()=>S.weather==='storm', text:"Deadfall creaks overhead in the wind - worth watching where you stand."},
  {loc:'woods', cond:()=>S.weather==='snow', text:"Snow sits heavy on every low branch, waiting to let go."},
  {loc:'woods', cond:()=>S.winter, text:"Your own tracks are the only ones going in."},
  {loc:'woods', cond:()=>S.hour<9, text:"The understory is still blue with early light."},
  {loc:'woods', cond:()=>S.hour>=18 && S.hour<21, text:"The trees close the light off early back here."},
  {loc:'woods', text:"Moss thick enough to sleep on, if it ever came to that."},
  {loc:'woods', text:"A woodpecker works somewhere out of sight, patient as a clock."},
  {loc:'woods', cond:()=>S.huntPressure>40, text:"It's quieter back here than it used to be - you've hunted this ground hard."},
  {loc:'woods', text:"Deadfall everywhere, the good kind - dry, ready to burn."},
  {loc:'woods', cond:()=>S.morale<30, text:"The trees all start to look the same after enough weeks of this."},
  {loc:'woods', text:"Something crashes once in the brush, then goes quiet for good."},
  {loc:'woods', cond:()=>S.day>20, text:"You know this stretch of timber better than you know most rooms back home."},
];
export function sensoryLine(loc?){
  const pool = SENSORY_POOL.filter(s => s.loc===loc && (!s.cond || s.cond()));
  return pool.length ? pick(pool).text : null;
}
export const SHOT_MISS_LOST: any = {
  shore: ['The arrow vanishes into dark water with barely a ripple - gone.','It skips off a rock and drops somewhere out past the shallows, swallowed by the lake.','The shaft buries itself in the reeds and you can\'t find it before the light\'s gone.','It clips the surface and sinks - the lake keeps this one.'],
  woods: ['The arrow rattles up into the spruce limbs overhead and doesn\'t come down where you can see.','It vanishes under a tangle of deadfall - not worth tearing the brush apart for.','The shaft skips off a root and disappears into the underbrush, gone for good.','It buries itself somewhere in the moss and duff - you search a while, then give up.'],
  snow: ['It vanishes into the powder without a sound - swallowed silently, no trace.','The shaft punches into a drift and disappears - digging for it isn\'t worth the cold.','It skips off the crust and buries itself somewhere you can\'t mark.','Snow closes over where it landed before you even get there.'],
};
export const SHOT_MISS_RECOVERED: any = {
  shore: ['The arrow skips off the gravel - you find it in the shallows, fletching soaked but whole.','It goes wide and sticks in the mud at the waterline. Cleaned off, back in the quiver.','It clatters off a stone and you spot it right away, half in the water.','A clean miss - the arrow\'s sitting in plain sight on the shingle.'],
  woods: ['The arrow goes wide and buries itself in a rotten stump - you work it free.','It skips off a trunk and lands in the open moss, easy to spot.','A clean miss - you find the shaft stuck upright in the leaf litter nearby.','It deflects off a branch and drops right at your feet.'],
  snow: ['The arrow skips off the crust and you spot the dark shaft against the white right away.','It goes wide and sticks upright in a drift, easy to see and easy to pull.','A clean miss - the fletching stands out plain against the snow.','It buries itself shallow in the crust a few yards short. Easy retrieve.'],
};
export const SHOT_HIT_RECOVERED: any = ['You hit it - and the arrow came free. Cleaned and back in the quiver.','A solid hit, and the arrow drops right where it stood. Retrieved, wiped down, back in the quiver.','Clean pass-through - the arrow lands a few feet past the animal. Back in the quiver.'];
export const LONELY_LINES: any = [`You catch yourself talking to the fire. It doesn't answer.`,'You dreamed of your kitchen at home. Waking up here was the hard part.',`You'd give a day's food to hear another voice.`,`You wonder what they're doing right now, back home. If they miss you this much.`];
export const SIGNS_WOODS: any = ['old scat, days cold. Nothing moving.','a squirrel scolds you from a spruce. Otherwise, still.','wind in the timber. No fresh sign.','chewed bark, but nothing recent.'];
export const SIGNS_SHORE: any = ['gull-picked fish bones on the stones.','an otter slide down the far bank.','flat calm. The lake gives nothing away.','raven tracks stitched along the waterline.'];
export const ACT_EMOJI: any = {forage:'🫐',snare:'🪤',moveSnare:'🪤',checkTraps:'👀',checkShore:'👀',scout:'🔭',follow:'🐾',shot:'🏹',trail:'🩸',carve:'🔪',haul:'🚚',call:'📣',invest:'👂',lines:'🎣',moveLine:'🎣',net:'🕸',iceFish:'🎏',smoke:'🥓',smokeHuge:'🥩',fire:'🔥',boil:'♨️',cook:'🍲',stream:'🏞',fetch:'🪣',clay:'🧱',jug:'🏺',picker:'🧺',wood:'🪵',woodCamp:'🪵',firewood:'🔥',dropoff:'📦',campSnares:'🪤',moss:'🌿',rocks:'🪨',shelter:'🏗',dugout:'⛏',insulate:'🧶',firepit:'⛰',rack:'🪵',hugeRack:'🪵',cache:'🗃',flute:'🪈',chair:'🪑',table:'🛠',bed:'🛌',music:'🎶',rest:'🧘',travel:'🚶',tinder:'🌾',explore:'🔎',idle:'🌲',confess:'🎥',iceCache:'🧊',sitwatch:'👁',wash:'🧼',friction:'🪵'};
export const SPOTS: any = {camp:[250,212],shore:[398,210],woods:[458,210]};
export const SPOT_TWEAK: any = {forage:[322,212],wood:[468,210],woodCamp:[230,212],firewood:[236,212],moss:[452,212],scout:[440,210],follow:[430,210],shot:[445,210],trail:[435,210],carve:[440,210],haul:[420,210],invest:[420,210],rocks:[356,214],clay:[364,216],fetch:[380,212],stream:[380,212],lines:[368,212],moveLine:[368,212],iceFish:[372,214],checkShore:[386,210],net:[400,210],call:[300,212],snare:[430,210],moveSnare:[430,210],shelter:[152,212],dugout:[152,212],insulate:[152,212],cache:[46,212],rack:[276,212],smoke:[276,212],chair:[306,212],table:[326,212],fire:[248,212],boil:[248,212],cook:[248,212],jug:[248,212],picker:[322,212],firepit:[248,212],tinder:[240,212],dropoff:[248,212],campSnares:[46,212],wash:[248,212]};

export const WOODS_SPOTS: any = [
  {id:'ridge',  name:'Ridge Trail'},
  {id:'creek',  name:'Creek Crossing'},
  {id:'burn',   name:'Old Burn'},
  {id:'meadow', name:'Beaver Meadow'},
  {id:'draw',   name:'Berry Draw'},
];
export const SHORE_SPOTS: any = [
  {id:'point',   name:'The Point'},
  {id:'inlet',   name:'Inlet Mouth'},
  {id:'bar',     name:'Rocky Bar'},
  {id:'channel', name:'Deep Channel'},
];
export const MAX_SNARES_PER_SPOT = 2;
export const MAX_SNARES_TOTAL = 10;
export const MAX_LINES_TOTAL = 3;

