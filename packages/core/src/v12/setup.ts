// Ported from legacy/tap-out-v12.html (lines 1229-1471). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { rand } from './runtime.ts';
import { clamp, hh, pick, shuffle } from './helpers.ts';
import { recLog } from './recorder.ts';
import { S, setS } from './state.ts';
import { KIT_POOL, RIVAL_NAMES, SHORE_SPOTS, TUNING, WOODS_SPOTS, maxEnergyForDay } from './tuning.ts';
import { render } from './ui.ts';
export function hasKit(id?){ return !!(S && S.kit && S.kit.has(id)); }

// v12 §3.1: THE DESCENT - temperature is the single source of truth. Deterministic per-day curve
// (same day always yields the same base temp within a run): arrival band -> hard <=5C by day 11 ->
// 0 at the rolled zero-cross day Z -> fast drop to a -20C floor by ~Z+13 -> smooth -20..-12 oscillation.
// A sine-based "wiggle" gives small daily noise with zero risk of a day-over-day jump (§12 check #2).
export function tempFor(day?){
  const T = TUNING.temperature;
  const Z = S.zeroCrossDay;
  const wiggle = Math.sin(day*1.7)*1.2 + Math.sin(day*0.6)*0.8; // smooth, bounded ~+/-2, never discontinuous
  const day1Mid = (T.day1Lo+T.day1Hi)/2;
  const day11Base = -2; // margin so ambientTempC's +4 day-bonus + wiggle still lands <=5 at day 11
  let base;
  if (day <= 11){
    const t = clamp((day-1)/10, 0, 1);
    base = day1Mid + (day11Base - day1Mid) * t;
  } else if (day < Z){
    const t = clamp((day-11)/Math.max(1,(Z-11)), 0, 1);
    base = day11Base + (0 - day11Base) * t;
  } else {
    const daysPast = day - Z;
    const floorDay = T.postCrossFloorDay;
    if (daysPast <= floorDay){
      const t = clamp(daysPast/floorDay, 0, 1);
      base = 0 + (T.floorTemp - 0) * t;
    } else {
      const phase = (daysPast - floorDay) * 0.3;
      base = -20 + (1-Math.cos(phase))/2 * 8; // smooth -20..-12 oscillation, continuous with the ramp (starts at -20, phase=0)
    }
  }
  base += wiggle;
  if (day >= Z) base = Math.min(base, -0.5); // hard rule: never >0 after the cross, regardless of wiggle
  return base;
}
export function season(){ return 1 + Math.min(Math.max(0, S.day-8)*0.02, 0.8); }
// v12 §3.2: precipitation type is DERIVED from temperature, never rolled independently. rollWeather()
// still chooses sky/intensity (clear/overcast/precip/storm/cold); a 'precip' roll resolves to rain
// above 0C and snow at or below 0C - so snow structurally cannot occur while temp > 0.
export function rollWeather(){
  const t = S.day, r = rand();
  const temp = tempFor(t);
  let table;
  if (t <= 3)      table = [['clear',.40],['overcast',.35],['precip',.15],['cold',.10]];
  else if (t < 10) table = [['clear',.30],['overcast',.25],['precip',.22],['cold',.13],['storm',.10]];
  else if (t < 20) table = [['clear',.20],['overcast',.22],['precip',.18],['cold',.30],['storm',.10]];
  else             table = [['clear',.12],['overcast',.18],['precip',.20],['cold',.40],['storm',.10]];
  let acc = 0, chosen = 'cold';
  for (const [k,p] of table){ acc += p; if (r < acc){ chosen = k; break; } }
  if (chosen === 'precip') return temp <= 0 ? 'snow' : 'rain';
  return chosen;
}
export function rollPredatorNext(){
  const r = rand();
  if (r < 0.03) return 'close';
  if (r < 0.11) return 'tracks';
  return null;
}
export function makeSpots(){
  let wq, sq, attempts = 0;
  do {
    wq = shuffle([...TUNING.catchRates.snareSpotQ]);
    sq = shuffle([...TUNING.catchRates.lineSpotQ]);
    attempts++;
  } while (Math.max(...sq) < TUNING.seedFloors.minFishingQ && attempts < 20);
  return {
    woods: WOODS_SPOTS.map((s,i)=>({id:s.id, name:s.name, q:wq[i], lastCheck:1, noLuck:0, pressure:0})),
    shore: SHORE_SPOTS.map((s,i)=>({id:s.id, name:s.name, q:sq[i], lastCheck:1, noLuck:0, pressure:0})),
  };
}

export function newGame(backstory?, startWeight?, name?, height?, sex?, kit?){
  backstory = backstory || {who:'nobody', fear:'failing'};
  startWeight = startWeight || 88;
  height = height || 178; sex = sex || 'man';
  name = (name && name.trim()) ? name.trim().slice(0,16) : 'Jack';
  kit = kit || new Set(KIT_POOL.filter(k=>k.std).map(k=>k.id));
  const tapDays = [];
  // compression: rival schedule halved alongside RUN_SCALE (was 4-40ish at scale 56)
  for (let i=0;i<8;i++) tapDays.push(2 + Math.floor(rand()*19));
  tapDays.push(21 + Math.floor(rand()*10));
  tapDays.sort((a,b)=>a-b);
  const spots = makeSpots();
  setS({
    day:1, hour:6, weather:'overcast', loc:'camp',
    energy: kit.has('bag') ? 180 : 165, maxEnergy:maxEnergyForDay(1), peakMax:180, minHealth:100,
    health:100, hunger:65, thirst:60, warmth:70, wet:0, morale:70, stress:25,
    meatQ:[], berryQ:[], smoked:0, cookedMeal:null, smokingSession:null, hugeSmokingSession:null, mealsHistory:[],
    water:0, rawWater:0,
    // kit-draft §2: wood splits into logs (stock.wood, requires axe/saw/shovel) and firewood (hand-gatherable).
    stock:{wood: kit.has('axe')?2:0, firewood:3, moss: 10 + Math.floor(rand()*7), rocks:0, clay:0},
    carry:{wood:0, rocks:0, moss:0, clay:0},
    tinder:2, hide:0,
    gear:{axe: kit.has('axe')?100:0, boots:100, ferro: kit.has('ferro')?100:0},
    campWoodStock: 40 + Math.floor(rand()*8), // compression: pre-picked deadfall halved with the run
    fireH:0, structure:0, buildProg:0, insulation:0, dugout:false, dugoutProg:0,
    firepitTier:0, rackTier:0, cacheTier:0, hugeRack:false, jug:false, berryPicker:false,
    chair:false, table:false, bed:false, instrument:false,
    woodsSpots: spots.woods, shoreSpots: spots.shore,
    snareList:[], lineList:[],
    net:{built: kit.has('net'), damaged:false, spot:null, lastCheck:1, noLuck:0, pressure:0},
    mooseLure:0, winter:false,
    // v12 §3.1: THE DESCENT replaces the old winterDay/freezeCrossDay pair entirely - one rolled day owns it all.
    zeroCrossDay: 12 + Math.floor(rand()*7), // [12,18]
    firstFrostHit:false,
    bigStormDay: 10 + Math.floor(rand()*6), bigStormDaysLeft:0, bigStormHit:false, // compression: was 20-30
    huntPressure:0,
    aweSeen:[], aweLastDay:0,
    chains:{roof:null, tooth:null, boot:null, axeHandle:null, grizzlyRepair:null},
    hunt:{state:'none', day:0, species:''}, soundsWoods:false,
    arrows: kit.has('bow') ? 9 : 0, killSite:null, killSiteCarry:0, hadFirstRaid:false, campSnares:false, restsToday:0,
    martenNamed:'the sassy pine marten', pendingRaid:null, _nightNotes:null,
    injury:null, predatorNearby:false,
    mealsToday:0, sickDays:0, forageDep:0, darkLogged:false, playedToday:false,
    rivals:9, tapDays, tapNames:shuffle([...RIVAL_NAMES]),
    signs:{camp:'',shore:'',woods:''},
    tot:{food:0,forage:0,snared:0,lines:0,net:0,deer:0,moose:0,beaver:0,wolverine:0,smoked:0,meals:0,wood:0,fires:0,injuries:0,predators:0,storms:0,sick:0,music:0,raids:0,animalsKilled:0},
    acts:{}, over:false, cause:'', log:[],
    backstory, startWeight, weight: startWeight, height, sex, sicknessPending:0, name,
    dawnSeen:[], dreamsSeen:[], confessionals:[], lastConfessDay:0, confessedToday:false, confessPrompt:false,
    daysSinceConfess:0,
    martenEscalation:0, ravenSeen:0, crowVisits:0, crowNamed:false, lastHumorDay:-99, lostAnimal:null, lostAnimalResighted:false,
    lastKillDay:0, medWarnings:0, finalTwoAnnounced:false, phoneStage:0, phoneForcedDay:0, lastPhoneMention:0,
    firstKill:null, lowestMoment:null, rivalOrder:[], predatorPending:null, birdsSilent:false, _firstSnowCeremony:false,
    kcal:0, kcalIntake:0, kcalBurn:0, smokedBatches:[], grizzlyHit:false, turnedInEarlyStreak:0,
    energyDebt:0, lateRiseHours:0, hoursOutsideStreak:0,
    lineStock: kit.has('line') ? TUNING.kit.lineStockTotal : 0, wireStock: kit.has('wire') ? TUNING.kit.wireStockTotal : 0,
    consecutiveSmokedOnlyDays:0, mealsHadOnlySmokedToday:false, wasteDiscardToday:0,
    emptyCheckStreak:0,
    _monologueOffset: Math.floor(rand()*4),
    medicalArc:null, arcsSurvived:0, arcHistory:[],
    conditions:{
      bearDread:{active:false, quietDays:0},
      raiderSiege:{active:false, stacks:0},
      rotStreak:{active:false, cleanStreak:0},
      wetBedding:{active:false},
      coldSnap:{active:false, coldStreak:0, warmStreak:0},
      soakedThrough:{active:false, dryHours:0},
      aCold:{active:false, daysLeft:0},
      nightFright:{active:false, quietDays:0},
      teeth:{tier:0, consecutiveSmokedDays:0, quietDays:0},
      moldyStock:{active:false},
    },
    spoilageDays:[], lastSpoilageDay:-99, sitsToday:0,
    letters:[], lastCallbackDay:0, bearDreadDay:0, firstRaidDay:0,
    jay:{appeared:false, stage:0, feeds:0, zeroFoodStreak:0, gone:false},
    firepitProg:0, cacheProg:0, netProg:0, netPendingSpot:null,
    iceCache:false, iceCacheProg:0, lastVisited:{camp:1,shore:1,woods:1}, overhangUsed:false,
    resolve:70, resolveCap:100, resolveCracks:0, adrenalineUsed:false,
    promise:null, promisesFired:[], forcedTapoutPending:false, resolveState:'Steady',
    stableDayStreak:0, lastResolveWarnDay:0,
    threads:['vowOfKill','debtLetter'], threadState:{}, treeMarkStreak:0, lastTreeMarkDay:0, hungerStreakDays:0,
    promiseWarningsGiven:0, _promiseRaidHappened:false, forcedTapout:false, refusalUsed:false,
    lastSetbackDay:1, highCIStreak:0, brutalStreak:0, lastCI:50, predatorFixation:false, treeMarkedToday:false,
    zeroCatchDayStreak:0, noSignStreak:0, anyCatchToday:false,
    tags:{proud:0, humble:0, bold:0, cautious:0, hard:0, tender:0, practical:0, spiritual:0},
    cardsToday:0, lastCardHour:-99, cardCooldowns:{}, cardsFiredOnce:{}, cardHistory:[], vow:null,
    breakdownEventsToday:0, breakdownStreakDays:0, modifiers:[],
    exposureToday:0, soakedThrough:false, dryHoursAccum:0,
    // v12 §4.1: Shivering - fire-rest hours accumulate while any cold/wet tag is active, clearing it at TUNING.shivering.clearHoursNeeded.
    shivering:false, shiverClearHours:0,
    // v12 §6: severe injury run-threatening state
    ankleSalvage:null, // {stat, deadlineDay} while the salvage clock is running
    deathSource:null, endingChoices:{},
    // v12 kit-draft: drafted items
    kit,
    // v12 §12 harness helper: last-turn refusal reason, for the anti-freeze "no silent refusals" invariant
    lastRefusalReason:null,
  });
  S.maxEnergy = maxEnergyForDay(1);
  S.energy = kit.has('bag') ? TUNING.energy.startArrival : TUNING.energy.startArrival - 15;
  S.weather = rollWeather();
  if (S.weather === 'storm') S.tot.storms++;
  const kitLine = kit.size === 10 && [...kit].every(id => KIT_POOL.find(k=>k.id===id).std)
    ? 'Dropped at your site with the standard 10-item kit and the clothes on your back.'
    : `Dropped at your site with your drafted kit and the clothes on your back.`;
  log(`${kitLine} Nine others are out there. Winter is coming. Last one standing.`, 'event');
  render();
}
export function log(msg?, cls='sys'){ S.log.unshift({msg, cls, t:`D${S.day} ${hh(S.hour)}`}); if (S.log.length > 90) S.log.pop(); recLog('log',{msg,cls}); }
export function waterCap(){ return 4 + (S.jug?4:0); }
export function computeBMI(){
  const hM = (S.height||178) / 100;
  return hM>0 ? S.weight / (hM*hM) : 22;
}
export function sensitivityMul(){
  const t = clamp(S.day / 25, 0, 1); // compression: sensitivity ramp halved alongside RUN_SCALE
  return TUNING.body.sensitivityAtStart + (TUNING.body.sensitivityAtDay50 - TUNING.body.sensitivityAtStart) * t;
}
export function curfewCapForLoc(loc?){ return TUNING.night.hardCapHour; }
export function consumeKitStock(kind?){
  if (kind === 'wire'){ S.wireStock = Math.max(0, S.wireStock - 1); S._kitCountPending = S._kitCountPending || {}; S._kitCountPending.wire = true; }
  else { S.lineStock = Math.max(0, S.lineStock - 1); S._kitCountPending = S._kitCountPending || {}; S._kitCountPending.line = true; }
}
export function registerEmptyCheck(){
  S.emptyCheckStreak = (S.emptyCheckStreak||0) + 1;
  if (S.emptyCheckStreak > 1){
    const extra = S.emptyCheckStreak - 1;
    S.morale = clamp(S.morale - extra);
    S.stress = clamp(S.stress + extra);
  }
}
export function registerWasteDiscard(n?){ S.wasteDiscardToday = (S.wasteDiscardToday||0) + n; }
export const SPOT_RENAME_POOLS: any = {
  fatCatch: ['Fat Hare Hollow','Lucky Ridge','The Sure Thing'],
  deadWoods: ['Empty Draw','Nothing Trail','The Dead Ground'],
  bigFish: ["The Big One's Hole",'Humongous Bar','Lucky Water'],
  deadShore: ['Still Water','The Empty Reach','Skunked Point'],
};
export function maybeRenameSpot(sp?, event?){
  if (!sp || sp.renamed) return;
  const pool = SPOT_RENAME_POOLS[event];
  if (!pool) return;
  sp.name = pick(pool);
  sp.renamed = true;
  log(`📍 You've started calling it "${sp.name}" - the name just stuck.`, 'sys');
}
export function checkSpotYield(q?, n?, spot?){
  if (n<=0) return 0;
  const pressure = spot.pressure || 0;
  const effQ = q * (1 - Math.min(0.6, pressure*0.5));
  const e = Math.max(1, Math.min(3, S.day - spot.lastCheck));
  let succ = 0;
  for (let i=0;i<n;i++) for (let d=0; d<e; d++) if (rand() < effQ) succ++;
  if (succ>0) spot.pressure = clamp((spot.pressure||0) + 0.2, 0, 1);
  spot.lastCheck = S.day;
  spot.noLuck = succ>0 ? 0 : spot.noLuck+1;
  return succ;
}

