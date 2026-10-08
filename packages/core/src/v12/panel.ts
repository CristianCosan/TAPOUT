// Ported from legacy/tap-out-v12.html (lines 5126-5501). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { fireCap } from './camp.ts';
import { ambientTempC, eCost, eTime, shiveringActive } from './cost.ts';
import { berryCount, cookedMealSpoiled, meatCount, oldestBerriesSpoiled, oldestMeatSpoiled } from './food.ts';
import { TRAVEL_HOURS, clamp, hh, nowAbs, roundDisplay } from './helpers.ts';
import { checkSmokingDone } from './person.ts';
import { curfewCapForLoc, hasKit, waterCap } from './setup.ts';
import { NET_SESSIONS } from './shore.ts';
import { S } from './state.ts';
import { isNightNow } from './threads.ts';
import { BUILD_NEED, CACHE_COST, CACHE_NEED, CARRY_CAP, DUGOUT_COST, DUGOUT_NEED, FIREPIT_COST, FIREPIT_NEED, GAME, HUGE_RACK_CAP, HUGE_RACK_COST, ICE_CACHE_COST, ICE_CACHE_NEED, MAX_LINES_TOTAL, MAX_SNARES_TOTAL, RACK_CAP, RACK_COST, SHELTERS, SHELTER_COST, TUNING, WEATHER, carryBlocked, carryType } from './tuning.ts';
import { enforceMoraleCeiling } from './worry.ts';
// ---- The action panel: v12's render() run against a recording page instead of a real one.
// What it records is exactly what v12 showed the player: which actions exist here, which are
// enabled, and the cost/requirement line under each.

export interface PanelButton { id: string; loc: string; onclick: string; label: string; hidden: boolean }
export const BUTTONS: readonly PanelButton[] = [
  {
    "id": "a-fire",
    "loc": "camp",
    "onclick": "actFire()",
    "label": "🔥 Light fire",
    "hidden": false
  },
  {
    "id": "a-boil",
    "loc": "camp",
    "onclick": "actBoil()",
    "label": "♨️ Boil water",
    "hidden": false
  },
  {
    "id": "a-cook",
    "loc": "camp",
    "onclick": "actCookMeal()",
    "label": "🍲 Cook a meal",
    "hidden": false
  },
  {
    "id": "a-smoke",
    "loc": "camp",
    "onclick": "actSmoke()",
    "label": "🥓 Smoke meat - rack",
    "hidden": false
  },
  {
    "id": "a-smokeHuge",
    "loc": "camp",
    "onclick": "actSmokeHuge()",
    "label": "🥩 Smoke meat - huge rack",
    "hidden": true
  },
  {
    "id": "a-woodCamp",
    "loc": "camp",
    "onclick": "actWoodCamp()",
    "label": "🪵 Scrounge firewood nearby",
    "hidden": false
  },
  {
    "id": "a-dropoff",
    "loc": "camp",
    "onclick": "actDropOff()",
    "label": "📦 Drop off at camp",
    "hidden": false
  },
  {
    "id": "a-shelter",
    "loc": "camp",
    "onclick": "actShelter()",
    "label": "🏕 Build shelter",
    "hidden": false
  },
  {
    "id": "a-dugout",
    "loc": "camp",
    "onclick": "actDugout()",
    "label": "⛏ Dig earth dugout",
    "hidden": true
  },
  {
    "id": "a-insulate",
    "loc": "camp",
    "onclick": "actInsulate()",
    "label": "🧶 Moss insulation",
    "hidden": false
  },
  {
    "id": "a-firepit",
    "loc": "camp",
    "onclick": "actFirepit()",
    "label": "⛰ Stone firepit",
    "hidden": false
  },
  {
    "id": "a-rack",
    "loc": "camp",
    "onclick": "actRack()",
    "label": "🪵 Smoking rack",
    "hidden": false
  },
  {
    "id": "a-hugeRack",
    "loc": "camp",
    "onclick": "actHugeRack()",
    "label": "🪵 Build huge smoking rack",
    "hidden": true
  },
  {
    "id": "a-cache",
    "loc": "camp",
    "onclick": "actCache()",
    "label": "🗃 Food cache",
    "hidden": false
  },
  {
    "id": "a-jug",
    "loc": "camp",
    "onclick": "actJug()",
    "label": "🏺 Fire a clay jug",
    "hidden": true
  },
  {
    "id": "a-picker",
    "loc": "camp",
    "onclick": "actBerryPicker()",
    "label": "🧺 Carve berry picker",
    "hidden": true
  },
  {
    "id": "a-campSnares",
    "loc": "camp",
    "onclick": "actCampSnares()",
    "label": "🪤 Set camp snares",
    "hidden": false
  },
  {
    "id": "a-sharpenAxe",
    "loc": "camp",
    "onclick": "actSharpenAxe()",
    "label": "🪓 Sharpen the axe",
    "hidden": true
  },
  {
    "id": "a-maintainFerro",
    "loc": "camp",
    "onclick": "actMaintainFerro()",
    "label": "🎇 Maintain ferro rod",
    "hidden": true
  },
  {
    "id": "a-haftAxe",
    "loc": "camp",
    "onclick": "actHaftAxe()",
    "label": "🪓 Haft a new axe handle",
    "hidden": true
  },
  {
    "id": "a-repairBoots",
    "loc": "camp",
    "onclick": "actRepairBoots()",
    "label": "🥾 Repair boots",
    "hidden": true
  },
  {
    "id": "a-patchRoof",
    "loc": "camp",
    "onclick": "actPatchRoof()",
    "label": "🏕 Patch the roof",
    "hidden": true
  },
  {
    "id": "a-poultice",
    "loc": "all",
    "onclick": "actPoultice()",
    "label": "🌿 Craft a willow poultice",
    "hidden": true
  },
  {
    "id": "a-friction",
    "loc": "camp",
    "onclick": "actFrictionFire()",
    "label": "🪵 Friction fire attempt",
    "hidden": true
  },
  {
    "id": "a-firenoferro",
    "loc": "camp",
    "onclick": "actFireNoFerro()",
    "label": "🔥 Light fire (no ferro)",
    "hidden": true
  },
  {
    "id": "a-flute",
    "loc": "camp",
    "onclick": "actFlute()",
    "label": "🪈 Carve a flute",
    "hidden": true
  },
  {
    "id": "a-chair",
    "loc": "camp",
    "onclick": "actChair()",
    "label": "🪑 Build a chair",
    "hidden": false
  },
  {
    "id": "a-table",
    "loc": "camp",
    "onclick": "actTable()",
    "label": "🛠 Build a table",
    "hidden": false
  },
  {
    "id": "a-bed",
    "loc": "camp",
    "onclick": "actBed()",
    "label": "🛌 Bough bed",
    "hidden": false
  },
  {
    "id": "a-confess",
    "loc": "camp",
    "onclick": "actConfess()",
    "label": "🎥 Talk to the camera",
    "hidden": false
  },
  {
    "id": "a-treemark",
    "loc": "camp",
    "onclick": "actTreeMark()",
    "label": "🪓 Mark the day on the post",
    "hidden": false
  },
  {
    "id": "a-feedjay",
    "loc": "camp",
    "onclick": "actFeedJay()",
    "label": "🐦 Feed the gray jay",
    "hidden": true
  },
  {
    "id": "a-wash",
    "loc": "camp",
    "onclick": "actWash()",
    "label": "🧼 Wash up",
    "hidden": true
  },
  {
    "id": "a-lines",
    "loc": "shore",
    "onclick": "openLineModal()",
    "label": "🎣 Set a fishing line",
    "hidden": false
  },
  {
    "id": "a-iceLine",
    "loc": "shore",
    "onclick": "openLineModal()",
    "label": "🧊 Cut a hole & set a line",
    "hidden": false
  },
  {
    "id": "a-iceFish",
    "loc": "shore",
    "onclick": "actIceFish()",
    "label": "🎏 Fish the hole actively",
    "hidden": false
  },
  {
    "id": "a-iceCache",
    "loc": "shore",
    "onclick": "actIceCache()",
    "label": "🧊 Cut an ice cache",
    "hidden": true
  },
  {
    "id": "a-moveLine",
    "loc": "shore",
    "onclick": "openMoveLineModal()",
    "label": "↔ Move a line",
    "hidden": false
  },
  {
    "id": "a-net",
    "loc": "shore",
    "onclick": "openNetModal()",
    "label": "🕸 Weave gill net",
    "hidden": true
  },
  {
    "id": "a-deploynet",
    "loc": "shore",
    "onclick": "openDeployNetModal()",
    "label": "🕸 Deploy gill net",
    "hidden": true
  },
  {
    "id": "a-checkShore",
    "loc": "shore",
    "onclick": "actCheckShore()",
    "label": "👀 Check lines & net",
    "hidden": false
  },
  {
    "id": "a-fetch",
    "loc": "shore",
    "onclick": "actFetchWater()",
    "label": "🪣 Fetch water",
    "hidden": false
  },
  {
    "id": "a-rocks",
    "loc": "shore",
    "onclick": "actRocks()",
    "label": "🪨 Gather rocks",
    "hidden": false
  },
  {
    "id": "a-clay",
    "loc": "shore",
    "onclick": "actClay()",
    "label": "🧱 Dig clay",
    "hidden": true
  },
  {
    "id": "a-stream",
    "loc": "shore",
    "onclick": "actStream()",
    "label": "🏞 Drink from stream",
    "hidden": false
  },
  {
    "id": "a-forage",
    "loc": "woods",
    "onclick": "actForage()",
    "label": "🫐 Forage",
    "hidden": false
  },
  {
    "id": "a-snare",
    "loc": "woods",
    "onclick": "openSnareModal()",
    "label": "🪤 Set a snare",
    "hidden": true
  },
  {
    "id": "a-moveSnare",
    "loc": "woods",
    "onclick": "openMoveSnareModal()",
    "label": "↔ Move a snare",
    "hidden": true
  },
  {
    "id": "a-checkTraps",
    "loc": "woods",
    "onclick": "actCheckTraps()",
    "label": "👀 Check snares",
    "hidden": false
  },
  {
    "id": "a-scout",
    "loc": "woods",
    "onclick": "actScout()",
    "label": "🔭 Scout for game",
    "hidden": true
  },
  {
    "id": "a-wood",
    "loc": "woods",
    "onclick": "actWood()",
    "label": "🪓 Fell & buck logs",
    "hidden": true
  },
  {
    "id": "a-firewood",
    "loc": "woods",
    "onclick": "actFirewood()",
    "label": "🔥 Gather firewood",
    "hidden": false
  },
  {
    "id": "a-moss",
    "loc": "woods",
    "onclick": "actMoss()",
    "label": "🌿 Gather moss",
    "hidden": false
  },
  {
    "id": "a-follow",
    "loc": "all",
    "onclick": "actFollow()",
    "label": "🐾 Follow the tracks",
    "hidden": true
  },
  {
    "id": "a-shot",
    "loc": "all",
    "onclick": "actShot()",
    "label": "🏹 Take the shot",
    "hidden": true
  },
  {
    "id": "a-trail",
    "loc": "all",
    "onclick": "actTrail()",
    "label": "🩸 Follow the blood trail",
    "hidden": true
  },
  {
    "id": "a-carve",
    "loc": "all",
    "onclick": "actCarve()",
    "label": "🔪 Carve the kill",
    "hidden": true
  },
  {
    "id": "a-haul",
    "loc": "all",
    "onclick": "actHaul()",
    "label": "🚚 Haul from kill site",
    "hidden": true
  },
  {
    "id": "a-invest",
    "loc": "all",
    "onclick": "actInvestigate()",
    "label": "👂 Head toward the sounds",
    "hidden": true
  },
  {
    "id": "a-tinder",
    "loc": "all",
    "onclick": "actTinder()",
    "label": "🌾 Gather tinder",
    "hidden": false
  },
  {
    "id": "a-call",
    "loc": "all",
    "onclick": "actCall()",
    "label": "📣 Moose call",
    "hidden": true
  },
  {
    "id": "a-music",
    "loc": "all",
    "onclick": "actMusic()",
    "label": "🎶 Play the flute",
    "hidden": true
  },
  {
    "id": "a-rest",
    "loc": "all",
    "onclick": "actRest()",
    "label": "🧘 Rest",
    "hidden": false
  },
  {
    "id": "a-sitwatch",
    "loc": "all",
    "onclick": "actSitWatch()",
    "label": "👁 Sit and watch",
    "hidden": false
  }
];

export interface PanelEntry { id: string; label: string; onclick: string; loc: string; visible: boolean; enabled: boolean; detail: string }

let recording: Map<string, any> | null = null;
function $(id) {
  if (!recording.has(id)) {
    const classes = new Set<string>();
    const initial = BUTTONS.find((b) => b.id === id);
    if (initial && initial.hidden) classes.add('hidden');
    recording.set(id, {
      id, textContent: '', innerHTML: '', disabled: false, style: {}, classes,
      classList: {
        add: (...n: string[]) => n.forEach((x) => classes.add(x)),
        remove: (...n: string[]) => n.forEach((x) => classes.delete(x)),
        toggle: (n: string, force?: boolean) => { const on = force ?? !classes.has(n); if (on) classes.add(n); else classes.delete(n); return on; },
        contains: (n: string) => classes.has(n),
      },
      setAttribute: () => {},
    });
  }
  return recording.get(id);
}
function setBtn(id, enabled, sub){ const b = $(id); if(!b) return; b.disabled = !enabled; const s = $(id + '-sub'); if (s) s.textContent = sub; }
function setBar(_id?, _val?) {}
function updateAmbient() {}
function renderModifierRow() {}
function renderScene() {}

export interface HudElement { id: string; text: string; html: string; disabled: boolean; hidden: boolean; classes: string[] }

/**
 * Everything else v12's render() writes for the player: the top pills, travel tabs, food and water
 * chips, inventory, condition chips, the sleep / turn-in / phone buttons. Keyed by v12's element
 * id. Reads state; never changes it.
 */
export function hudRecord(): Map<string, HudElement> {
  recording = new Map();
  try {
    panelPass();
    const out = new Map<string, HudElement>();
    for (const [id, el] of recording) {
      out.set(id, { id, text: el.textContent ?? '', html: el.innerHTML ?? '', disabled: !!el.disabled, hidden: el.classes.has('hidden'), classes: [...el.classes] });
    }
    return out;
  } finally {
    recording = null;
  }
}

/** What v12 would show in its action list right now. Reads state; never changes it. */
export function actionPanel(): PanelEntry[] {
  recording = new Map();
  try {
    panelPass();
    return BUTTONS.map((b) => {
      const el = $(b.id);
      const name = recording.get(b.id + '-name');
      return {
        id: b.id,
        label: name && name.textContent ? name.textContent : b.label,
        onclick: b.onclick,
        loc: b.loc,
        visible: !el.classes.has('hidden') && (b.loc === 'all' || b.loc === S.loc),
        enabled: !el.disabled && !S.over,
        detail: recording.get(b.id + '-sub')?.textContent ?? '',
      };
    });
  } finally {
    recording = null;
  }
}

export function durTxt(h?){
  if (h<=0) return 'free';
  if (h<1) return Math.round(h*60)+'min';
  const whole = Math.floor(h), rem = Math.round((h-whole)*60);
  return rem>0 ? `${whole}h${rem}m` : `${whole}h`;
}
export function gate(cost?, hrs?, ok?, msg?, sub?, tags='', cap?){
  if (cap === undefined) cap = curfewCapForLoc(S.loc);
  const c = eCost(cost, tags);
  if (S.over) return [false, '-'];
  if (!ok) return [false, msg];
  const physical = (tags.includes('o') || tags.includes('w')) && hrs > 0;
  const nightMod = isNightNow() && physical;
  let effHrs = nightMod ? eTime(hrs,tags) * TUNING.night.timeMultiplier : eTime(hrs,tags);
  if (S.hour + effHrs > cap) return [false, "too late - you'd be finishing that in the dark past any sense"];
  if (S.energy < c) return [false, "too exhausted - you don't have the energy for that right now"];
  let text = sub.replace('{c}', roundDisplay(c));
  if (nightMod) text += ` · night +${Math.round((TUNING.night.timeMultiplier-1)*100)}% time, +stress`;
  if (S.winter && physical) text += ' · post-snow +25% energy';
  if (shiveringActive() && (tags.includes('o')||tags.includes('w')||tags.includes('h'))) text += ' · Shivering: 1.5x time, 2x energy';
  return [true, text];
}
export const comfortLvl = () => (S.chair?1:0)+(S.table?1:0)+(S.bed?1:0);

function panelPass(){
  const w = WEATHER[S.weather];
  $('pillDay').innerHTML = `Day <b>${S.day}</b> · ${hh(S.hour)}${S.winter?' ❄️':''}`;
  $('pillWx').textContent = `${w.icon} ${w.label}`;
  $('pillTemp').textContent = `🌡 ${ambientTempC()}°C`;
  $('pillRivals').innerHTML = `👥 <b>${S.rivals}</b> left`;
  $('pillWeight').innerHTML = `⚖️ <b>${S.weight.toFixed(1)}</b>kg`;
  updateAmbient();

  setBar('health', S.health); setBar('hunger', S.hunger); setBar('thirst', S.thirst);
  setBar('warmth', S.warmth); setBar('morale', S.morale); setBar('stress', S.stress);
  renderModifierRow();
  {
    const c = S.conditions;
    const chips = [];
    if (c.rotStreak.active) chips.push('🥓 Rot Streak');
    if (c.wetBedding.active) chips.push('💧 Wet Bedding');
    if (c.coldSnap.active) chips.push('❄️ Cold Snap Fatigue');
    if (S.medicalArc && S.medicalArc.stage) chips.push(`🩹 ${S.medicalArc.label}`);
    $('conditionChips').innerHTML = chips.map(t => `<span class="chip warn">${t}</span>`).join('');
  }
  $('cap-energy').style.width = (S.maxEnergy/120*100) + '%';
  const eb = $('bar-energy');
  eb.style.width = (clamp(S.energy,0,120)/120*100) + '%';
  eb.classList.toggle('crit', S.energy/S.maxEnergy < 0.22);
  $('val-energy').textContent = `${roundDisplay(S.energy)}/${S.maxEnergy}`;

  const fc = $('chip-fire');
  fc.innerHTML = S.fireH > 0 ? `🔥 Fire: <b>~${S.fireH.toFixed(1)}h</b>/${fireCap()}` : `🔥 Fire: <b>out</b>`;
  fc.classList.toggle('fire-on', S.fireH > 0);
  const prog = S.structure < 3 ? ` · ${S.buildProg}/${BUILD_NEED[S.structure]}` : '';
  $('chip-shelter').innerHTML = S.dugout ? `🏕 <b>Earth dugout</b>` : `🏕 <b>${SHELTERS[S.structure]}</b>${S.insulation ? ' 🌿×' + S.insulation : ''}${prog}`;
  const wc = $('chip-wet');
  wc.innerHTML = S.wet > 60 ? '💦 <b>Soaked</b>' : S.wet > 25 ? '💧 <b>Damp</b>' : '☀️ <b>Dry</b>';
  wc.classList.toggle('warn', S.wet > 60);
  const ic = $('chip-injury');
  ic.classList.toggle('hidden', !S.injury);
  if (S.injury) ic.innerHTML = `🤕 <b>${S.injury.type === 'ankle' ? (S.injury.broken?'Broken ankle':'Sprained ankle') : 'Hurt wrist'}</b>${S.injury.broken?'':` (${S.injury.days}d)`}`;
  $('chip-wolf').classList.toggle('hidden', !S.predatorNearby);

  $('eatBerriesBtn').innerHTML = `🍇 <b>${berryCount()}${oldestBerriesSpoiled()?' ⚠️':''}</b> - eat`;
  $('eatCookedBtn').innerHTML = `🍲 <b>${S.cookedMeal?1:0}${cookedMealSpoiled()?' ⚠️':''}</b> - eat`;
  $('eatSmokedBtn').innerHTML = `🥓 <b>${S.smoked}</b> - eat`;
  $('drinkBtn').innerHTML = `💧 Water <b>${S.water}/${waterCap()}</b> - drink`;
  $('eatBerriesBtn').disabled = S.over || berryCount()<=0;
  $('eatCookedBtn').disabled = S.over || !S.cookedMeal;
  $('eatSmokedBtn').disabled = S.over || S.smoked<=0;
  $('drinkBtn').disabled = S.over || S.water <= 0;
  $('inv-meat').textContent = meatCount() + (oldestMeatSpoiled()?' ⚠️':'');
  $('inv-arrows').textContent = `${S.arrows}/9`;
  $('inv-raw').textContent = `${S.rawWater}/4`;
  $('inv-tinder').textContent = S.tinder;
  $('inv-wood').textContent = S.stock.wood;
  $('inv-firewood').textContent = S.stock.firewood;
  $('inv-moss').textContent = S.stock.moss;
  $('inv-rocks').textContent = S.stock.rocks;
  $('inv-clay').textContent = S.stock.clay;
  const carryBits = [];
  if (S.carry.wood>0) carryBits.push(`🪵 ${S.carry.wood}/${CARRY_CAP.wood}`);
  if (S.carry.rocks>0) carryBits.push(`🪨 ${S.carry.rocks}/${CARRY_CAP.rocks}`);
  if (S.carry.moss>0) carryBits.push(`🌿 ${S.carry.moss}/${CARRY_CAP.moss}`);
  if (S.carry.clay>0) carryBits.push(`🧱 ${S.carry.clay}/${CARRY_CAP.clay}`);
  if (S.killSiteCarry>0) carryBits.push(`🥩 ${S.killSiteCarry} meat loaded`);
  $('carryChips').innerHTML = carryBits.length ? `<span class="chip">🎒 carrying: ${carryBits.join(' · ')}</span>` : '';
  const kitBits = [];
  if (hasKit('line') && S.lineStock <= TUNING.kit.lineWorryThreshold) kitBits.push(`🎣 line: ${S.lineStock} left`);
  if (hasKit('wire') && S.wireStock <= TUNING.kit.wireWorryThreshold) kitBits.push(`➰ wire: ${S.wireStock} left`);
  if (kitBits.length) $('carryChips').innerHTML += `<span class="chip warn">${kitBits.join(' · ')}</span>`;

  const travelE = eCost(S.winter?5:3,'ot');
  const travelHrsBase = S.winter ? TRAVEL_HOURS*TUNING.postSnow.travelTimeMultiplier : TRAVEL_HOURS/2;
  for (const l of ['camp','shore','woods']){
    const tab = $('tab-' + l);
    tab.classList.toggle('here', S.loc === l);
    const hrs = eTime(travelHrsBase,'ot');
    const cap = curfewCapForLoc(l);
    const travelNight = isNightNow();
    const effHrs = travelNight ? hrs * TUNING.night.timeMultiplier : hrs;
    tab.disabled = S.over || (S.loc !== l && (S.energy < travelE || S.hour + effHrs > cap));
    const snowNote = S.winter ? ' · post-snow +50%' : '';
    $('tt-' + l).textContent = S.loc === l ? 'you are here' : `walk ${durTxt(hrs)}${travelNight?' · night +30%':''}${snowNote} · −${roundDisplay(travelE)}⚡`;
  }
  $('signsLine').textContent = S.signs[S.loc] || (S.loc === 'camp' ? 'The fire ring, the shelter, everything you have.' : '');


  // v12 kit-draft: gate every item-dependent button's visibility on the drafted kit.
  $('a-snare').classList.toggle('hidden', !hasKit('wire'));
  $('a-moveSnare').classList.toggle('hidden', !hasKit('wire'));
  $('a-scout').classList.toggle('hidden', !hasKit('bow'));
  $('a-call').classList.toggle('hidden', !hasKit('bow'));
  $('a-net').classList.toggle('hidden', S.winter || hasKit('net'));
  $('a-deploynet').classList.toggle('hidden', true);
  $('a-jug').classList.toggle('hidden', !hasKit('pot'));
  $('a-sharpenAxe').classList.toggle('hidden', !hasKit('axe'));
  $('a-maintainFerro').classList.toggle('hidden', !hasKit('ferro'));
  $('a-picker').classList.toggle('hidden', false);
  $('a-flute').classList.toggle('hidden', false);
  $('a-music').classList.toggle('hidden', !S.instrument);
  $('a-wash').classList.toggle('hidden', !hasKit('soap'));
  $('a-dugout').classList.toggle('hidden', !hasKit('shovel') || S.dugout);
  $('a-wood').classList.toggle('hidden', !hasKit('axe') && !hasKit('saw') && !hasKit('shovel'));

  let r;
  const lightWoodCost = S.firepitTier>=2 ? 1 : 2;
  if (S.fireH > 0){
    $('a-fire-name').textContent = '🔥 Stoke fire';
    r = S.over ? [false,'-'] : (S.fireH >= fireCap() ? [false,'the pit is full'] : (S.stock.firewood < 1 ? [false,'need 1 firewood'] : [true, `free · 1 firewood · +${[2,3,4][S.firepitTier]}h fuel · +morale`]));
  } else if (!hasKit('ferro')){
    $('a-fire-name').textContent = '🔥 Friction fire';
    const ok = S.stock.firewood >= lightWoodCost && S.tinder >= 1;
    r = S.over ? [false,'-'] : (!ok ? [false, S.tinder<1?'need tinder':`need ${lightWoodCost} firewood`] : [true, `−6⚡ · 1h30m · bow-drill, weather-dependent, morale sting on fail`]);
  } else {
    $('a-fire-name').textContent = '🔥 Light fire';
    const ok = S.stock.firewood >= lightWoodCost && S.tinder >= 1;
    const missing = S.tinder<1 ? 'need tinder' : `need ${lightWoodCost} firewood`;
    r = S.over ? [false,'-'] : (!ok ? [false,missing] : [true, `free · ${lightWoodCost} firewood + 1 tinder · ${Math.round(Math.min(0.95, WEATHER[S.weather].fireChance + S.structure*0.05)*100)}%`]);
  }
  setBtn('a-fire', r[0], r[1]);
  r = !hasKit('pot') ? [false,'no pot drafted - no boiling this run'] : S.fireH <= 0 ? [false,'fire needed'] : (S.rawWater<=0 ? [false,'need raw water - fetch some at the shore'] : (S.water >= waterCap() ? [false,'storage full'] : [true, S.energy<3 ? `${durTxt(0.25)} · up to +3 safe water · running on empty - borrows energy` : `−3⚡ · ${durTxt(0.25)} · up to +3 safe water`]));
  setBtn('a-boil', r[0], r[1]);
  r = !hasKit('pot') ? [false,'no pot drafted - no real meals this run'] : S.cookedMeal ? [false,'eat your meal first'] : (S.fireH<=0 ? [false,'fire needed'] : (meatCount()<2 ? [false,'need 2 raw meat'] : (S.water<2 ? [false,'need 2 safe water'] : [true, S.energy<4 ? `${durTxt(0.25)} · 2 meat + 2 water → 1 meal · running on empty - borrows energy` : `−4⚡ · ${durTxt(0.25)} · 2 meat + 2 water → 1 meal`])));
  setBtn('a-cook', r[0], r[1]);
  r = S.smokingSession ? [false,`smoking - ready in ${roundDisplay(Math.max(0,S.smokingSession.doneAbs-nowAbs()))}h`] : (S.rackTier<=0 ? [false,'build a smoking rack'] : (S.fireH <= 0 ? [false,'fire needed'] : (meatCount() <= 0 ? [false,'no raw meat'] : (S.stock.firewood<1||S.tinder<1) ? [false,'need 1 firewood + 1 tinder'] : gate(5,0.25,true,'',`−{c}⚡ · ${durTxt(0.25)} · 1 firewood + 1 tinder · preserves up to ${RACK_CAP[S.rackTier]}, ready in 12h${S.hour>=22?' · night work: +stress':''}`,''))));
  setBtn('a-smoke', r[0], r[1]);
  $('a-smokeHuge').classList.toggle('hidden', !S.hugeRack);
  if (S.hugeRack){
    r = S.hugeSmokingSession ? [false,`smoking - ready in ${roundDisplay(Math.max(0,S.hugeSmokingSession.doneAbs-nowAbs()))}h`] : (S.fireH <= 0 ? [false,'fire needed'] : (meatCount() <= 0 ? [false,'no raw meat'] : (S.stock.firewood<2||S.tinder<1) ? [false,'need 2 firewood + 1 tinder'] : gate(5,0.25,true,'',`−{c}⚡ · ${durTxt(0.25)} · 2 firewood + 1 tinder · preserves up to ${HUGE_RACK_CAP}, ready in 12h${S.hour>=22?' · night work: +stress':''}`,'')));
    setBtn('a-smokeHuge', r[0], r[1]);
  }
  r = S.campWoodStock<=0 ? [false,'picked clean - try the woods'] : gate(5,TUNING.costs.woodCampMin/60,true,'',`−{c}⚡ · ${durTxt(TUNING.costs.woodCampMin/60)} · 3-5 firewood`,'oh');
  setBtn('a-woodCamp', r[0], r[1]);
  r = gate(4,0.5,true,'',`−{c}⚡ · ${durTxt(0.5)} · 3-5 firewood, hand-gathered`,'o');
  setBtn('a-firewood', r[0], r[1]);
  const anyCarry = S.carry.wood+S.carry.rocks+S.carry.moss+S.carry.clay > 0;
  r = anyCarry ? [true,'free - unload your pack'] : [false,'nothing to drop off'];
  setBtn('a-dropoff', r[0], r[1]);

  if (S.structure>=3 || S.dugout) r=[false, S.dugout?'earth dugout stands instead':'fully built'];
  else {
    const c = SHELTER_COST[S.structure], need = BUILD_NEED[S.structure];
    const ok = S.stock.wood>=c.wood && (!c.moss||S.stock.moss>=c.moss) && (!c.clay||S.stock.clay>=c.clay);
    const missing = [c.wood+' logs', c.moss?c.moss+' moss':null, c.clay?c.clay+' clay':null].filter(Boolean).join(' + ');
    r = gate(c.e,c.h, ok, `need ${missing}`, `−{c}⚡ · ${durTxt(c.h)} · ${missing} · ${S.buildProg}/${need} → ${SHELTERS[S.structure+1]}`, 'oh');
  }
  setBtn('a-shelter', r[0], r[1]);
  if (hasKit('shovel') && !S.dugout){
    r = S.stock.wood < DUGOUT_COST.wood ? [false, `need ${DUGOUT_COST.wood} logs`] : gate(DUGOUT_COST.e, DUGOUT_COST.h, true, '', `−{c}⚡ · ${durTxt(DUGOUT_COST.h)} · ${DUGOUT_COST.wood} logs · ${S.dugoutProg}/${DUGOUT_NEED} · top-tier warmth, near-immune to storms`, 'ohw');
    setBtn('a-dugout', r[0], r[1]);
  }
  r = S.structure < 1 ? [false,'build a lean-to first'] : (S.insulation >= 3 ? [false,'fully insulated'] : gate(6,1, S.stock.moss >= 4, 'need 4 moss', `−{c}⚡ · ${durTxt(1)} · 4 moss · ${S.insulation}/3`, 'oh'));
  setBtn('a-insulate', r[0], r[1]);
  if (S.firepitTier>=2){ $('a-firepit-name').textContent = '⛰ Clay-lined pit'; r = [false,'built - heat holds longer']; }
  else {
    const c = FIREPIT_COST[S.firepitTier+1], need = FIREPIT_NEED[S.firepitTier+1];
    $('a-firepit-name').textContent = S.firepitTier===0 ? '⛰ Stone firepit' : '⛰ Clay-line the pit';
    const ok = S.stock.rocks>=c.rocks && (!c.clay||S.stock.clay>=c.clay);
    const missing = [c.rocks+' rocks', c.clay?c.clay+' clay':null].filter(Boolean).join(' + ');
    r = gate(c.e,c.h, ok, `need ${missing}`, `−{c}⚡ · ${durTxt(c.h)} · ${missing} · ${S.firepitProg}/${need}`, 'oh');
  }
  setBtn('a-firepit', r[0], r[1]);
  if (S.rackTier>=2){ $('a-rack-name').textContent = '🪵 Covered rack'; r = [false,'built - sheds rain, sturdier']; }
  else {
    const c = RACK_COST[S.rackTier+1];
    $('a-rack-name').textContent = S.rackTier===0 ? '🪵 Smoking rack' : '🪵 Cover the rack';
    const ok = S.stock.wood>=c.wood && (!c.rocks||S.stock.rocks>=c.rocks);
    const missing = [c.wood+' logs', c.rocks?c.rocks+' rocks':null].filter(Boolean).join(' + ');
    r = gate(c.e,c.h, ok, `need ${missing}`, `−{c}⚡ · ${durTxt(c.h)} · ${missing}`, 'oh');
  }
  setBtn('a-rack', r[0], r[1]);
  $('a-hugeRack').classList.toggle('hidden', S.rackTier < 1 || S.hugeRack);
  if (S.rackTier >= 1 && !S.hugeRack){
    const c = HUGE_RACK_COST;
    const ok = S.stock.wood>=c.wood && S.stock.rocks>=c.rocks;
    r = gate(c.e,c.h, ok, `need ${c.wood} logs + ${c.rocks} rocks`, `−{c}⚡ · ${durTxt(c.h)} · ${c.wood} logs + ${c.rocks} rocks · capacity ${HUGE_RACK_CAP} · runs independently of the regular rack`, 'oh');
    setBtn('a-hugeRack', r[0], r[1]);
  }
  if (S.cacheTier>=3){ $('a-cache-name').textContent = '🗃 Elevated cache'; r = [false,'built - about as safe as it gets']; }
  else {
    const c = CACHE_COST[S.cacheTier+1], need = CACHE_NEED[S.cacheTier+1];
    $('a-cache-name').textContent = S.cacheTier===0 ? '🗃 Food cache' : S.cacheTier===1 ? '🗃 Reinforce cache' : '🗃 Elevate cache';
    const ok = (!c.wood||S.stock.wood>=c.wood) && (!c.rocks||S.stock.rocks>=c.rocks) && (!c.clay||S.stock.clay>=c.clay);
    const missing = [c.wood?c.wood+' logs':null, c.rocks?c.rocks+' rocks':null, c.clay?c.clay+' clay':null].filter(Boolean).join(' + ');
    r = gate(c.e,c.h, ok, `need ${missing}`, `−{c}⚡ · ${durTxt(c.h)} · ${missing} · ${S.cacheProg}/${need}`, 'oh');
  }
  setBtn('a-cache', r[0], r[1]);
  if (hasKit('pot')){
    r = S.jug ? [false,'built - water storage doubled'] : (S.fireH<=0 ? [false,'needs fire to bake'] : gate(8,1, S.stock.clay>=TUNING.costs.jugClayNeed, `need ${TUNING.costs.jugClayNeed} clay`, `−{c}⚡ · ${durTxt(1)} · ${TUNING.costs.jugClayNeed} clay`, 'h') /* LEG-006: the action takes 3; v12's button asked for 4 */);
    setBtn('a-jug', r[0], r[1]);
  }
  r = S.berryPicker ? [false,'carved - foraging is faster'] : gate(4,1, S.stock.wood>=2, 'need 2 logs', `−{c}⚡ · ${durTxt(1)} · 2 logs`, 'h');
  setBtn('a-picker', r[0], r[1]);
  r = !S.hadFirstRaid ? [false,'need to survive a raid first'] : (S.campSnares ? [false,'set - raiders think twice'] : gate(6,0.5, S.stock.wood>=2, 'need 2 logs', `−{c}⚡ · ${durTxt(0.5)} · 2 logs`, 'h'));
  setBtn('a-campSnares', r[0], r[1]);

  r = (!hasKit('axe')) ? [false,'no axe drafted'] : (S.gear.axe>=100 || S.chains.axeHandle) ? [false, S.chains.axeHandle?'handle\'s broken - haft a new one':'edge is fine'] : gate(4,0.5,true,'',`−{c}⚡ · ${durTxt(0.5)} · axe ${Math.round(S.gear.axe)}%`,'h');
  setBtn('a-sharpenAxe', r[0], r[1]);
  r = (!hasKit('ferro')) ? [false,'no ferro rod drafted'] : S.gear.ferro>=100 ? [false,'reliable already'] : gate(3,0.25,true,'',`−{c}⚡ · ${durTxt(0.25)} · ferro ${Math.round(S.gear.ferro)}%`,'h');
  setBtn('a-maintainFerro', r[0], r[1]);
  $('a-haftAxe').classList.toggle('hidden', !hasKit('axe') || !S.chains.axeHandle);
  r = (hasKit('axe') && S.chains.axeHandle) ? gate(10,1.5, S.stock.wood>=2, 'need 2 logs', `−{c}⚡ · ${durTxt(1.5)} · 2 logs`,'h') : [false,'-'];
  setBtn('a-haftAxe', r[0], r[1]);
  $('a-repairBoots').classList.toggle('hidden', !S.chains.boot);
  r = S.chains.boot ? gate(10,1.5, S.hide>=2, `need 2 hide (have ${S.hide})`, `−{c}⚡ · ${durTxt(1.5)} · 2 hide`,'h') : [false,'-'];
  setBtn('a-repairBoots', r[0], r[1]);
  $('a-patchRoof').classList.toggle('hidden', !S.chains.roof);
  r = S.chains.roof ? gate(10,1.5, S.stock.wood>=3 && S.stock.moss>=3, 'need 3 logs + 3 moss', `−{c}⚡ · ${durTxt(1.5)} · 3 logs + 3 moss`,'oh') : [false,'-'];
  setBtn('a-patchRoof', r[0], r[1]);
  $('a-poultice').classList.toggle('hidden', !S.medicalArc || S.medicalArc.stage!=='treatment');
  r = (S.medicalArc && S.medicalArc.stage==='treatment') ? gate(6,1, true, '', `−{c}⚡ · ${durTxt(1)} · dose ${(S.medicalArc.dosesGiven||0)+1}/${S.medicalArc.dosesNeeded} · max energy −25% while treating`,'h') : [false,'-'];
  setBtn('a-poultice', r[0], r[1]);
  const gearBits = [];
  if (hasKit('axe') && S.gear.axe<60) gearBits.push(`🪓 axe ${Math.round(S.gear.axe)}%`);
  if (S.gear.boots<60) gearBits.push(`🥾 boots ${Math.round(S.gear.boots)}%`);
  if (hasKit('ferro') && S.gear.ferro<60) gearBits.push(`🎇 ferro ${Math.round(S.gear.ferro)}%`);
  if (S.hide>0) gearBits.push(`🟫 hide ${S.hide}`);
  $('gearChips').innerHTML = gearBits.length ? `<span class="chip">${gearBits.join(' · ')}</span>` : '';

  if (S.instrument){ $('a-flute-name').textContent = '🪈 Willow flute'; r = [false,'carved - play it anywhere']; }
  else { $('a-flute-name').textContent = '🪈 Carve a flute'; r = gate(6,1.5, S.stock.wood >= 1, 'need 1 log', `−{c}⚡ · ${durTxt(1.5)} · 1 log · +morale`, 'h'); }
  setBtn('a-flute', r[0], r[1]);
  r = S.chair ? [false,'built (+comfort)'] : gate(6,1, S.stock.wood >= 3, 'need 3 logs', `−{c}⚡ · ${durTxt(1)} · 3 logs · +comfort`, 'h');
  setBtn('a-chair', r[0], r[1]);
  r = S.table ? [false,'built (+comfort)'] : gate(6,1, S.stock.wood >= 3, 'need 3 logs', `−{c}⚡ · ${durTxt(1)} · 3 logs · +comfort`, 'h');
  setBtn('a-table', r[0], r[1]);
  r = S.bed ? [false,'built (+comfort)'] : gate(5,1, S.stock.moss >= 4, 'need 4 moss', `−{c}⚡ · ${durTxt(1)} · 4 moss · +comfort`, 'h');
  setBtn('a-bed', r[0], r[1]);
  r = S.confessedToday ? [false,'said your piece today'] : gate(2,0.5,true,'',`−{c}⚡ · ${durTxt(0.5)} · get something off your chest`);
  setBtn('a-confess', r[0], r[1]);
  $('a-confess').classList.toggle('glow', !!S.confessPrompt && !S.confessedToday);
  r = S.treeMarkedToday ? [false,'marked today'] : gate(1,0.0833,true,'',`−{c}⚡ · ${durTxt(0.0833)} · ${S.treeMarkStreak||0}-day streak`);
  setBtn('a-treemark', r[0], r[1]);
  $('a-feedjay').classList.toggle('hidden', S.jay.stage < 1 || S.jay.stage >= 4 || S.jay.gone);
  r = (meatCount()+S.smoked+berryCount()<=0) ? [false,'nothing to spare'] : [true, 'free · a scrap, deliberately given'];
  setBtn('a-feedjay', r[0], r[1]);
  if (hasKit('soap')){
    r = S.washedToday ? [false,'clean already'] : gate(2,0.25,true,'',`−{c}⚡ · ${durTxt(0.25)} · +morale, lowers infection risk`);
    setBtn('a-wash', r[0], r[1]);
  }

  $('a-lines').classList.toggle('hidden', S.winter || !hasKit('line'));
  $('a-iceLine').classList.toggle('hidden', !S.winter || !hasKit('line'));
  $('a-iceFish').classList.toggle('hidden', !S.winter);
  const lineCount = S.lineList.length;
  const lineE = S.winter?6:4, lineH = S.winter?0.5:0.25;
  if (hasKit('line')){
    r = S.lineStock<=0 ? [false,'out of line'] : lineCount>=MAX_LINES_TOTAL ? [false,'all lines out'] : gate(lineE,lineH,true,'',`−{c}⚡ · ${durTxt(lineH)} · pick a spot · ${S.lineStock} left`,'oh');
    setBtn('a-lines', r[0], r[1]);
    setBtn('a-iceLine', r[0], r[1]);
  }
  r = lineCount<=0 ? [false,'no lines set'] : gate(3,0.25,true,'',`−{c}⚡ · ${durTxt(0.25)}`,'o');
  setBtn('a-moveLine', r[0], r[1]);
  if (!S.winter && !hasKit('net')){
    if (S.net.damaged){ $('a-net-name').textContent = '🕸 Repair gill net'; r = gate(4,0.25,true,'',`−{c}⚡ · ${durTxt(0.25)}`,'oh'); }
    else if (S.net.built){ $('a-net-name').textContent = '🕸 Move gill net'; r = gate(4,0.25,true,'',`−{c}⚡ · ${durTxt(0.25)} to relocate`,'oh'); }
    else if (S.netProg > 0){ $('a-net-name').textContent = '🕸 Keep weaving net'; r = gate(8,2,true,'',`−{c}⚡ · ${durTxt(2)} · ${S.netProg}/${NET_SESSIONS} done`,'ohw'); }
    else { $('a-net-name').textContent = '🕸 Weave gill net'; r = gate(8,2,true,'',`−{c}⚡ · ${durTxt(2)} · pick a spot · 5 sessions`,'ohw'); }
    setBtn('a-net', r[0], r[1]);
  } else if (!S.winter && hasKit('net') && S.net.damaged){
    $('a-net-name').textContent = '🕸 Repair gill net';
    r = gate(4,0.25,true,'',`−{c}⚡ · ${durTxt(0.25)}`,'oh');
    $('a-net').classList.remove('hidden');
    setBtn('a-net', r[0], r[1]);
  } else if (!S.winter && hasKit('net')){
    $('a-net-name').textContent = '🕸 Move gill net (ready-made)';
    r = gate(4,0.25,true,'',`−{c}⚡ · ${durTxt(0.25)} to relocate`,'oh');
    $('a-net').classList.remove('hidden');
    setBtn('a-net', r[0], r[1]);
  }
  r = S.winter ? gate(10,2,true,'',`−{c}⚡ · ${durTxt(2)} · pick a hole`,'oh') : [false,'-'];
  setBtn('a-iceFish', r[0], r[1]);
  $('a-iceCache').classList.toggle('hidden', !S.winter || S.iceCache);
  if (S.winter && !S.iceCache){
    r = gate(ICE_CACHE_COST.e, ICE_CACHE_COST.h, true, '', `−{c}⚡ · ${durTxt(ICE_CACHE_COST.h)} · ${S.iceCacheProg}/${ICE_CACHE_NEED} · absolutely critter-proof when done`, 'ohw');
    setBtn('a-iceCache', r[0], r[1]);
  }
  r = (lineCount<=0 && !(S.net.built && !S.winter)) ? [false,'nothing set yet'] : gate(3,0.1667,true,'',`−{c}⚡ · ${durTxt(0.1667)}`,'o');
  setBtn('a-checkShore', r[0], r[1]);
  r = !hasKit('pot') ? [false,'no pot - drink at the stream directly'] : S.rawWater>=4 ? [false,'pot is full'] : gate(TUNING.costs.fetchWaterE,TUNING.costs.fetchWaterMin/60,true,'',`−{c}⚡ · ${durTxt(TUNING.costs.fetchWaterMin/60)} · fills the pot`,'o');
  setBtn('a-fetch', r[0], r[1]);
  r = S.carry.rocks>=CARRY_CAP.rocks ? [false,'pack full - drop off at camp'] : carryBlocked('rocks') ? [false,`hands full of ${carryType()} - drop off at camp first`] : gate(6,TUNING.costs.rocksMin/60,true,'',`−{c}⚡ · ${durTxt(TUNING.costs.rocksMin/60)} · +3 rocks`,'ohw'); setBtn('a-rocks', r[0], r[1]);
  $('a-clay').classList.toggle('hidden', !hasKit('pot') && !hasKit('shovel'));
  r = S.carry.clay>=CARRY_CAP.clay ? [false,'pack full - drop off at camp'] : carryBlocked('clay') ? [false,`hands full of ${carryType()} - drop off at camp first`] : gate(5,TUNING.costs.clayMin/60,true,'',`−{c}⚡ · ${durTxt(TUNING.costs.clayMin/60)} · +2-3 clay`,'oh'); setBtn('a-clay', r[0], r[1]);
  r = gate(2,0.0833,true,'',`−{c}⚡ · ${durTxt(0.0833)} · risky (20% sick, slip chance in rain)`,'o'); setBtn('a-stream', r[0], r[1]);

  const snareTotal = S.snareList.length;
  const depNote = S.forageDep >= 4 ? ' · picked over' : '';
  r = S.carry.wood>=CARRY_CAP.wood ? [false,'pack full - drop off at camp'] : gate(TUNING.costs.forageE,(S.berryPicker?0.8:1)*TUNING.costs.forageMin/60,true,'', `−{c}⚡ · ${durTxt((S.berryPicker?0.8:1)*TUNING.costs.forageMin/60)}${depNote}`,'o'); setBtn('a-forage', r[0], r[1]);
  if (hasKit('wire')){
    r = S.wireStock<=0 ? [false,'out of wire'] : snareTotal>=MAX_SNARES_TOTAL ? [false,'trapline full (10/10)'] : gate(2,0.0833,true,'',`−{c}⚡ · ${durTxt(0.0833)} · pick a spot · ${S.wireStock} left`,'oh'); setBtn('a-snare', r[0], r[1]);
    r = snareTotal<=0 ? [false,'no snares set'] : gate(2,0.0833,true,'',`−{c}⚡ · ${durTxt(0.0833)}`,'o'); setBtn('a-moveSnare', r[0], r[1]);
  }
  r = snareTotal<=0 ? [false,'no snares set'] : gate(2,0.1667,true,'', `−{c}⚡ · ${durTxt(0.1667)}`,'o');
  setBtn('a-checkTraps', r[0], r[1]);
  if (hasKit('bow')){
    { const pm = 1 + S.huntPressure/150; r = gate(Math.round(TUNING.costs.scoutE*pm),0.5*pm,true,'',`−{c}⚡ · ${durTxt(0.5*pm)} · look for tracks${S.huntPressure>40?' (game pushed out)':''}`,'o'); setBtn('a-scout', r[0], r[1]); }
  }
  const hs = S.hunt.state;
  $('a-follow').classList.toggle('hidden', !(hs === 'tracks' || hs === 'hot'));
  { const pm = 1 + S.huntPressure/150; r = gate(Math.round(TUNING.costs.followBaseE*pm),0.75*pm,true,'', (hs === 'hot' ? 'trail is HOT · ' : '') + `−{c}⚡ · ${durTxt(0.75*pm)}`,'o'); setBtn('a-follow', r[0], r[1]); }
  $('a-shot').classList.toggle('hidden', hs !== 'spotted');
  r = S.arrows<=0 ? [false,'out of arrows'] : gate(5,0.1667,true,'', `${GAME[S.hunt.species]?GAME[S.hunt.species].label:'something'} in range · −{c}⚡ · ${durTxt(0.1667)}`,'o'); setBtn('a-shot', r[0], r[1]);
  $('a-trail').classList.toggle('hidden', hs !== 'trailing');
  r = gate(TUNING.costs.trailBaseE,0.5,true,'', (S.hunt.wounded?'wounded - trail may go cold · ':'') + `−{c}⚡ · ${durTxt(0.5)}`,'o'); setBtn('a-trail', r[0], r[1]);
  $('a-carve').classList.toggle('hidden', !S.killSite || S.killSite.carved);
  if (S.killSite && !S.killSite.carved){
    const big = GAME[S.killSite.species].tier==='big';
    const knifeMul = hasKit('knife') ? 0.75 : 1;
    r = S.loc!==S.killSite.loc ? [false,`go to the ${S.killSite.loc} first`] : gate(Math.round((big?18:12)*knifeMul), (big?2:1.2)*knifeMul, true, '', `−{c}⚡ · ${durTxt((big?2:1.2)*knifeMul)}`, 'h');
  } else r = [false,'-'];
  setBtn('a-carve', r[0], r[1]);
  $('a-haul').classList.toggle('hidden', !S.killSite || !S.killSite.carved);
  if (S.killSite && S.killSite.carved){
    if (S.killSiteCarry > 0){
      $('a-haul-name') && ($('a-haul-name').textContent = '🚚 Walk it to camp');
      r = (S.loc===S.killSite.loc) ? gate(TUNING.costs.haulLoadedE, TUNING.costs.haulLoadedMin/60, true, '', `carrying ${S.killSiteCarry} · −{c}⚡ · ${durTxt(TUNING.costs.haulLoadedMin/60)}`, 'ot') : [false,'already loaded - walking it in'];
    } else if (S.loc !== S.killSite.loc && S.loc === 'camp'){
      r = gate(TUNING.costs.haulUnloadedE, TUNING.costs.haulUnloadedMin/60, true, '', `${S.killSite.meatRemaining} meat left at site · −{c}⚡ · ${durTxt(TUNING.costs.haulUnloadedMin/60)} walk back`, 'ot');
    } else {
      r = gate(0, 0, true, '', `${S.killSite.meatRemaining} meat left · load up to 12`, '');
    }
  } else r = [false,'-'];
  setBtn('a-haul', r[0], r[1]);
  $('a-invest').classList.toggle('hidden', !S.soundsWoods);
  r = gate(6,0.5,true,'',`−{c}⚡ · ${durTxt(0.5)} · could be anything`,'o'); setBtn('a-invest', r[0], r[1]);
  r = S.carry.wood>=CARRY_CAP.wood ? [false,'pack full - drop off at camp'] : carryBlocked('wood') ? [false,`hands full of ${carryType()} - drop off at camp first`] : gate(6,1,true,'',`−{c}⚡ · ${durTxt(1)} · +3-5 logs`,'ohw wood'); setBtn('a-wood', r[0], r[1]);
  r = S.carry.moss>=CARRY_CAP.moss ? [false,'pack full - drop off at camp'] : carryBlocked('moss') ? [false,`hands full of ${carryType()} - drop off at camp first`] : gate(TUNING.costs.mossE,TUNING.costs.mossMin/60,true,'',`−{c}⚡ · ${durTxt(TUNING.costs.mossMin/60)} · +3-4 moss`,'oh'); setBtn('a-moss', r[0], r[1]);

  r = gate(2,TUNING.costs.tinderMin/60,true,'',`−{c}⚡ · ${durTxt(TUNING.costs.tinderMin/60)} · +${TUNING.costs.tinderYieldLo}-${TUNING.costs.tinderYieldHi} tinder`,'o'); setBtn('a-tinder', r[0], r[1]);
  r = !S.instrument ? [false,'carve a flute first'] : (S.playedToday ? [false,'played today - the quiet holds'] : gate(4,0.5,true,'',`−{c}⚡ · ${durTxt(0.5)} · +morale, −stress`));
  setBtn('a-music', r[0], r[1]);
  r = gate(0,1,true,'', S.restsToday>=2 ? `${durTxt(1)} · +3⚡ - running on fumes` : (S.fireH > 0 && S.loc === 'camp' ? `${durTxt(1)} · +${10 + comfortLvl()*2}⚡ by the fire` : `${durTxt(1)} · +${6 + comfortLvl()*2}⚡`), '');
  setBtn('a-rest', r[0], r[1]);
  r = gate(0,0.5,true,'', S.sitsToday>=2 ? `${durTxt(0.5)} · just quiet now` : `${durTxt(0.5)} · free · +1 morale · a chance the stillness pays off`, '');
  setBtn('a-sitwatch', r[0], r[1]);

  $('sleepBtn').disabled = S.over || S.hour < 16;
  $('sleep-sub').textContent = S.hour < 16 ? 'available from 16:00' : (S.loc !== 'camp' ? 'you\'ll walk back to camp and turn in' : '6 hours of rest, wherever bedtime lands you');
  $('earlyBtn').classList.toggle('hidden', S.over);
  $('early-label').textContent = S.loc === 'camp' ? '😪 Turn in early' : '🚶 Head back and turn in';
  $('early-sub').textContent = 'a longer night\'s drain + −4 morale - but never nothing to do';
  $('tapBtn').disabled = S.over;
  $('tapBtn').classList.toggle('phoneWarm', !S.finalTwoAnnounced && ((S.morale < 40 && S.morale >= 20) || S.resolveState === 'Wavering'));
  $('tapBtn').classList.toggle('phonePulse', !S.finalTwoAnnounced && (S.morale < 20 || S.resolveState === 'Cracking' || (S.medicalArc && S.medicalArc.forcedTapOnly)));
  $('log').innerHTML = S.log.map(l => `<div class="ln ${l.cls}"><span class="t">${l.t}</span>${l.msg}</div>`).join('');
  renderScene();
}

