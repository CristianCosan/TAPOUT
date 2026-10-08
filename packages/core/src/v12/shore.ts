// Ported from legacy/tap-out-v12.html (lines 2871-3109). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { rand } from './runtime.ts';
import { addMeat } from './food.ts';
import { clamp } from './helpers.ts';
import { triggerMedicalArc } from './medical.ts';
import { consumeKitStock, hasKit, log, maybeRenameSpot, registerEmptyCheck } from './setup.ts';
import { S } from './state.ts';
import { afterAction, spend } from './threads.ts';
import { CARRY_CAP, MAX_LINES_TOTAL, TUNING, carryBlocked, rollFish } from './tuning.ts';
import { $, hideModal, showModal } from './ui.ts';
import { pityMultiplier } from './woods.ts';
// ============================== actions: shore ==============================
export function openLineModal(){
  if (!hasKit('line')){ showModal(`<h3>No fishing line</h3><div class="wsub">You didn't draft any - passive lines were never an option this run. A net, if you drafted or weave one, still works.</div><button class="mbtn ghost" onclick="hideModal()">Close</button>`); return; }
  if (S.lineStock <= 0){ showModal(`<h3>Out of line</h3><div class="wsub">The last of your fishing line is used up. Setting lines is finished for this run.</div><button class="mbtn ghost" onclick="hideModal()">Close</button>`); return; }
  if (S.lineList.length>=MAX_LINES_TOTAL){ showModal(`<h3>Lines full</h3><div class="wsub">All the lines you can manage are already out.</div><button class="mbtn ghost" onclick="hideModal()">Close</button>`); return; }
  const rows = S.shoreSpots.map(sp => {
    const countHere = S.lineList.filter(ln=>ln.spotId===sp.id).length;
    const dead = sp.noLuck>=3;
    return `<li style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
      <span>${sp.name}${dead?' · dead for days':''}</span>
      <span style="display:flex;gap:6px">
      <button class="mbtn ghost" style="width:auto;padding:8px 12px;margin:0" ${countHere>=1?'disabled':''} onclick="placeLineAt('${sp.id}')">Set here</button>
      ${dead?`<button class="mbtn ghost" style="width:auto;padding:8px 12px;margin:0" onclick="exploreNewGrounds('shore','${sp.id}')">Explore new grounds</button>`:''}
      </span>
    </li>`;
  }).join('');
  const sub = S.winter ? `Cut a hole through the ice and drop a line. −6⚡ · 30min · ${S.lineStock} line left` : `Pick a spot off the shore. −4⚡ · 15min · ${S.lineStock} line left`;
  showModal(`<h3>${S.winter?'Cut a hole & set a line':'Set a fishing line'}</h3><div class="wsub">${sub}</div><ul>${rows}</ul><button class="mbtn ghost" onclick="hideModal()">Cancel</button>`);
}
export function placeLineAt(id?){
  const sp = S.shoreSpots.find(s=>s.id===id);
  const countHere = S.lineList.filter(ln=>ln.spotId===id).length;
  if (!sp || countHere>=1 || S.lineList.length>=MAX_LINES_TOTAL || S.lineStock<=0){ hideModal(); return; }
  const e = S.winter?6:4, h = S.winter?0.5:0.25;
  if (!spend(e,h,true,'oh')){ hideModal(); return; }
  S.lineList.push({spotId:id, day:S.day, lastCheck:S.day});
  consumeKitStock('line');
  hideModal();
  log(S.winter ? `You chop through a foot of ice and drop a line down the hole at the ${sp.name}.` : `You bait hooks and set a line off the ${sp.name}.`, 'good');
  afterAction('lines');
}
export function openMoveLineModal(){
  if (!S.lineList.length){ showModal(`<h3>Nothing to move</h3><div class="wsub">You have no lines set yet.</div><button class="mbtn ghost" onclick="hideModal()">Close</button>`); return; }
  const rows = S.lineList.map((ln,i) => {
    const sp = S.shoreSpots.find(s=>s.id===ln.spotId);
    return `<li style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <span>Line ${i+1} - ${sp.name}</span>
      <button class="mbtn ghost" style="width:auto;padding:8px 12px;margin:0" onclick="openMoveLineTarget(${i})">Pull up</button>
    </li>`;
  }).join('');
  showModal(`<h3>Move a line</h3><ul>${rows}</ul><button class="mbtn ghost" onclick="hideModal()">Cancel</button>`);
}
export function openMoveLineTarget(idx?){
  const ln = S.lineList[idx];
  if (!ln){ hideModal(); return; }
  const rows = S.shoreSpots.filter(sp => !S.lineList.some(x=>x.spotId===sp.id)).map(sp => `<li style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <span>${sp.name}</span>
      <button class="mbtn ghost" style="width:auto;padding:8px 12px;margin:0" onclick="moveLine(${idx},'${sp.id}')">Reset here</button>
    </li>`).join('');
  if (!rows){ showModal(`<h3>No room</h3><div class="wsub">Every other spot already has a line.</div><button class="mbtn ghost" onclick="hideModal()">Close</button>`); return; }
  showModal(`<h3>Move to…</h3><ul>${rows}</ul><button class="mbtn ghost" onclick="hideModal()">Cancel</button>`);
}
export function moveLine(idx?, toId?){
  const ln = S.lineList[idx];
  if (!ln){ hideModal(); return; }
  if (!spend(3,0.25,true,'o')){ hideModal(); return; }
  ln.spotId = toId; ln.lastCheck = S.day;
  hideModal();
  log(`You move the line elsewhere.`, 'good');
  afterAction('moveLine');
}
export const NET_SESSIONS = 5;
export function openNetModal(){
  if (S.winter){ showModal(`<h3>Frozen over</h3><div class="wsub">The net is useless under the ice now. Cut holes and fish instead.</div><button class="mbtn ghost" onclick="hideModal()">Close</button>`); return; }
  if (S.net.built && S.net.damaged){
    if (!spend(4,0.25,true,'oh')) return;
    S.net.damaged = false; S.net.lastCheck = S.day; S.net.noLuck = 0;
    log('You rework the torn mesh and reset the net.', 'good');
    afterAction('net'); return;
  }
  if (!S.net.built && S.netProg > 0){
    const sp = S.shoreSpots.find(s=>s.id===S.netPendingSpot);
    showModal(`<h3>Weaving the gill net</h3><div class="wsub">${S.netProg}/${NET_SESSIONS} sessions done · continuing at ${sp?sp.name:'the chosen spot'}. −8⚡ · 2h each.</div>
      <button class="mbtn" onclick="hideModal(); continueWeaveNet()">Keep weaving</button>
      <button class="mbtn ghost" onclick="hideModal()">Not now</button>`);
    return;
  }
  const rows = S.shoreSpots.map(sp => {
    const here = S.net.built && S.net.spot===sp.id;
    return `<li style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <span>${sp.name}</span>
      <button class="mbtn ghost" style="width:auto;padding:8px 12px;margin:0" ${here?'disabled':''} onclick="placeNetAt('${sp.id}')">${S.net.built ? (here?'Set':'Move here') : 'Start weaving here'}</button>
    </li>`;
  }).join('');
  showModal(`<h3>${S.net.built?'Move the gill net':'Weave a gill net'}</h3><div class="wsub">${S.net.built?'−4⚡ · 15min to relocate':'−8⚡ · 2h × 5 sessions (10h total, labor only) - the first big specialization commitment'}</div><ul>${rows}</ul><button class="mbtn ghost" onclick="hideModal()">Cancel</button>`);
}
export function openDeployNetModal(){ openNetModal(); } // kit-draft §3.1: a ready-made net skips the weave, deploy via the same spot-picker
export function placeNetAt(id?){
  const sp = S.shoreSpots.find(s=>s.id===id);
  if (!sp) return;
  if (S.net.built){
    if (S.net.spot===id) return;
    if (!spend(4,0.25,true,'oh')){ hideModal(); return; }
    S.net.spot = id; S.net.lastCheck = S.day; S.net.noLuck = 0;
    hideModal();
    log(`You pull the net and reset it off the ${sp.name}.`, 'good');
    afterAction('net');
  } else {
    S.netPendingSpot = id;
    hideModal();
    weaveNetSession(sp);
  }
}
export function continueWeaveNet(){
  const sp = S.shoreSpots.find(s=>s.id===S.netPendingSpot);
  if (!sp){ S.netProg = 0; return; }
  weaveNetSession(sp);
}
export function weaveNetSession(sp?){
  if (!spend(8,2,true,'ohw')) return;
  S.netProg++;
  if (S.netProg >= NET_SESSIONS){
    S.net.built = true; S.net.spot = sp.id; S.net.lastCheck = S.day; S.net.noLuck = 0; S.netProg = 0; S.netPendingSpot = null;
    log(`After five long sessions, the gill net is finally finished - woven and set off the ${sp.name}. It will fish while you sleep.`, 'good');
  } else {
    log(`Another long session weaving the net at the ${sp.name}. ${S.netProg}/${NET_SESSIONS} done.`, 'good');
  }
  afterAction('net');
}
export function actCheckShore(){
  const netActive = S.net.built && !S.winter;
  if (!S.lineList.length && !netActive) return;
  openCheckShoreModal();
}
export function openCheckShoreModal(){
  let rows = S.lineList.map((ln,i) => {
    const sp = S.shoreSpots.find(s=>s.id===ln.spotId);
    return `<li id="lineRow${i}" style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <span>Line ${i+1} - ${sp.name}</span>
      <button class="mbtn ghost" style="width:auto;padding:8px 12px;margin:0" onclick="checkOneLine(${i})">Check</button>
    </li>`;
  }).join('');
  const netActive = S.net.built && !S.winter;
  if (netActive){
    rows += `<li id="netRow" style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <span>Gill net${S.net.damaged?' (torn)':''}</span>
      <button class="mbtn ghost" style="width:auto;padding:8px 12px;margin:0" ${S.net.damaged?'disabled':''} onclick="checkNet()">Check</button>
    </li>`;
  }
  showModal(`<h3>Lines &amp; net</h3><div class="wsub">Check each - 1min · 1⚡ each</div><ul>${rows}</ul><button class="mbtn ghost" onclick="hideModal()">Done</button>`);
}
export function checkOneLine(i?){
  const ln = S.lineList[i];
  if (!ln) return;
  const sp = S.shoreSpots.find(s=>s.id===ln.spotId);
  if (!spend(1,0.0167,true,'o')) return;
  const days = Math.max(1, Math.min(3, S.day - ln.lastCheck));
  ln.lastCheck = S.day;
  let hit=false;
  let q = Math.min(0.9, sp.q * pityMultiplier()) * TUNING.food.passiveCutMultiplier;
  for (let d=0; d<days; d++) if (rand() < q) hit = true;
  let resultText;
  if (hit){
    const fish = rollFish();
    addMeat(fish.meat, 'lines'); sp.noLuck = 0; S.anyCatchToday = true;
    resultText = `✓ a ${fish.name} fish - ${fish.meat} meat`;
    log(`Caught. A ${fish.name} fish on the line. +${fish.meat} meat.`, 'good');
    if ((fish.name==='big'||fish.name==='humongous') && rand()<0.5) maybeRenameSpot(sp,'bigFish');
  } else { sp.noLuck++; resultText = '- empty'; S.morale = clamp(S.morale - 1); S.stress = clamp(S.stress + 1); registerEmptyCheck(); log('Empty. Nothing on the line.', 'bad'); if (sp.noLuck>=5) maybeRenameSpot(sp,'deadShore'); }
  const row = $('lineRow'+i);
  if (row) row.innerHTML = `<span>Line ${i+1} - ${sp.name}: ${resultText}</span>`;
  afterAction('checkShore');
}
export function checkNet(){
  if (!S.net.built || S.net.damaged || S.winter) return;
  if (!spend(2,0.033,true,'o')) return;
  const sp = S.shoreSpots.find(s=>s.id===S.net.spot);
  const days = Math.max(1, Math.min(3, S.day - S.net.lastCheck));
  S.net.lastCheck = S.day;
  let meatTot=0, descs=[];
  let q = Math.min(0.9, sp.q * TUNING.catchRates.netMultiplier * pityMultiplier()) * TUNING.food.passiveCutMultiplier;
  for (let d=0; d<days; d++) if (rand() < q){ const f = rollFish(); meatTot+=f.meat; descs.push(`a ${f.name} fish`); }
  let resultText;
  if (meatTot>0){ addMeat(meatTot,'net'); S.net.noLuck=0; S.anyCatchToday = true; resultText = `✓ ${descs.join(', ')} - ${meatTot} meat`; log(`Caught. ${descs.join(', ')} in the net. +${meatTot} meat.`, 'good'); }
  else { S.net.noLuck++; resultText='- empty'; S.morale = clamp(S.morale - 1); S.stress = clamp(S.stress + 1); registerEmptyCheck(); log('Empty. Nothing in the net.', 'bad'); }
  const row = $('netRow');
  if (row) row.innerHTML = `<span>Gill net: ${resultText}</span>`;
  afterAction('checkShore');
}
export function actIceFish(){
  if (!S.winter) return;
  const rows = S.shoreSpots.map(sp => `<li style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <span>${sp.name}</span>
      <button class="mbtn ghost" style="width:auto;padding:8px 12px;margin:0" onclick="iceFishAt('${sp.id}')">Fish here</button>
    </li>`).join('');
  showModal(`<h3>Fish the ice</h3><div class="wsub">Cut a hole and jig actively for 2 hours - better odds than a line, no return trip needed. −10⚡ · 2h</div><ul>${rows}</ul><button class="mbtn ghost" onclick="hideModal()">Cancel</button>`);
}
export function iceFishAt(id?){
  const sp = S.shoreSpots.find(s=>s.id===id);
  if (!sp){ hideModal(); return; }
  if (!spend(10,2,true,'oh')){ hideModal(); return; }
  hideModal();
  const p = Math.min(0.85, sp.q*2.4);
  if (rand() < p){
    const fish = rollFish();
    addMeat(fish.meat, 'net');
    log(`Caught. Jigging through the hole pays off - a ${fish.name} fish, ${fish.meat} meat.`, 'good');
  } else { log('Nothing. Two hours of jigging through the ice and nothing bites.', 'bad'); registerEmptyCheck(); }
  afterAction('iceFish');
}
export function actFetchWater(){
  if (S.rawWater >= 4) return;
  if (!hasKit('pot')){ actStream(); return; } // kit-draft §2: no pot means no boiling/storage - fetch just routes to the risk of drinking raw
  if (!spend(TUNING.costs.fetchWaterE,TUNING.costs.fetchWaterMin/60,true,'o')) return;
  S.rawWater = 4;
  log('You haul the pot down to the water\'s edge and fill it. Raw water - needs boiling before it\'s safe.', 'good');
  afterAction('fetch');
}
export function actRocks(){
  if (S.carry.rocks >= CARRY_CAP.rocks || carryBlocked('rocks')) return;
  if (!spend(6,TUNING.costs.rocksMin/60,true,'ohw')) return;
  const n = Math.min(3, CARRY_CAP.rocks - S.carry.rocks);
  S.carry.rocks += n;
  log(`You haul flat stones up from the shoreline. +${n} rocks (carrying ${S.carry.rocks}/${CARRY_CAP.rocks})`, 'good');
  afterAction('rocks');
}
export function actClay(){
  if (S.carry.clay >= CARRY_CAP.clay || carryBlocked('clay')) return;
  if (!spend(5,TUNING.costs.clayMin/60,true,'oh')) return;
  let n = 2 + Math.floor(rand()*2);
  n = Math.min(n, CARRY_CAP.clay - S.carry.clay);
  S.carry.clay += n;
  log(`You cut wet clay from the bank in slabs. +${n} clay (carrying ${S.carry.clay}/${CARRY_CAP.clay})`, 'good');
  afterAction('clay');
}
export function actStream(){
  showModal(`<h3>Drink from the stream?</h3><div class="wsub">It isn't boiled. There's a real chance it makes you sick.</div>
    <button class="mbtn" onclick="hideModal(); doStream()">Drink it</button>
    <button class="mbtn ghost" onclick="hideModal()">Not worth it</button>`);
}
export function doStream(){
  if (!spend(2,0.0833,true,'o')) return;
  S.thirst = clamp(S.thirst + 30);
  const soapCut = hasKit('soap') ? 0.6 : 1;
  if (S.sickDays === 0 && rand() < 0.20*soapCut){
    triggerMedicalArc('giardia');
    log('Bad water. You drink straight from the stream… your gut knots up within the hour.', 'bad');
  } else log('Clean enough. You drink straight from the stream and get away with it. +30 thirst', 'good');
  afterAction('stream');
}

