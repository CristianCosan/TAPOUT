// Ported from legacy/tap-out-v12.html (lines 4808-5056). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { showAnkleBreakCard } from './breakSequence.ts';
import { offerBreakdownChoice } from './breakdown.ts';
import { WHO_LABEL } from './camp.ts';
import { showCard } from './cards.ts';
import { ambientTempC } from './cost.ts';
import { startEndingSequence } from './endingSequences.ts';
import { pick, roundDisplay } from './helpers.ts';
import { forcedTapPhoneMoment } from './medical.ts';
import { computeBMI } from './setup.ts';
import { S } from './state.ts';
import { dominantTagAxis } from './tags.ts';
import { ACT_EMOJI, GAME, SHELTERS, TUNING, WEATHER } from './tuning.ts';
import { $, hideModal, render, revealParagraphs, showModal, typewriterInto } from './ui.ts';
export function showNightModal(notes?){
  const w = WEATHER[S.weather];
  showModal(`
    <h3>Day ${S.day}</h3>
    <div class="wsub">${w.icon} ${w.label} · ${ambientTempC(false)}°C · ${S.rivals} rival${S.rivals === 1 ? '' : 's'} still out there</div>
    <ul>${notes.map(n => `<li>${n}</li>`).join('') || '<li>A quiet night. You slept alright.</li>'}</ul>
    <button class="mbtn" onclick="hideModal(); afterNightContinue();">Start the day</button>
  `);
}
export function afterNightContinue(){
  if (S.over) return;
  if (S._firstSnowCeremony){ S._firstSnowCeremony = false; showFirstSnowCeremony(); return; }
  afterNightContinue2();
}
export function showFirstSnowCeremony(){
  showModal(`
    <h3>❄️ First Hard Snow</h3>
    <div class="wsub">Winter has arrived.</div>
    <div class="wsub tw" id="twSnow" onclick="skipTypewriter('twSnow')"></div>
    <button class="mbtn" onclick="hideModal(); afterNightContinue2();">Continue</button>
  `);
  typewriterInto('twSnow', "By dawn the shallows had gone milky and stiff. Within days the lake will freeze enough to walk on. Open-water lines and the net are done for the season - cut through the ice to fish from here on. Post-snow, every trip costs more time and more energy, and land snaring is about to go quiet for the winter - ice fishing carries you now.", 16);
}
export function afterNightContinue2(){
  if (S.over) return;
  if (S._pendingAnkleBreakCard){ showAnkleBreakCard(); return; }
  if (S._pendingCard){ const c = S._pendingCard; S._pendingCard = null; showCard(c); return; }
  if (S._pendingBreakdownChoice){ const ev = S._pendingBreakdownChoice; S._pendingBreakdownChoice = null; offerBreakdownChoice(ev); return; }
  const forcePhone = S.morale <= 10 && !S.finalTwoAnnounced && S.phoneForcedDay !== S.day;
  if (forcePhone) forcePhoneMoment();
}
export function confirmTapOut(){
  if (S.over) return;
  if (S.medicalArc && S.medicalArc.forcedTapOnly){ forcedTapPhoneMoment(); return; }
  const who = WHO_LABEL[S.backstory.who] || 'no one waiting, if you are honest';
  showModal(`
    <h3>The sat phone is in your hand</h3>
    <div class="wsub">Day ${S.day}. ${S.rivals} rival${S.rivals===1?'':'s'} still out there.</div>
    <ul>
      <li>You've lasted ${S.day} day${S.day===1?'':'s'} out here.</li>
      <li>${S.rivals} other${S.rivals===1?' is':'s are'} still in the field, still trying.</li>
      <li>Walking away means no prize and no second attempt - just ${who}, and a story about how far you got and no further.</li>
    </ul>
    <button class="mbtn" onclick="confirmTapOutStep2()">Keep holding the phone</button>
    <button class="mbtn ghost" onclick="hideModal()">Put it down, go back to work</button>
  `);
}
export function confirmTapOutStep2(){
  showModal(`
    <h3>Are you sure?</h3>
    <div class="wsub tw" id="twTapOut" onclick="skipTypewriter('twTapOut')"></div>
    <button class="mbtn" onclick="hideModal(); endGame('tap')">"I'm done. Come get me."</button>
    <button class="mbtn ghost" onclick="hideModal()">Not yet</button>
  `);
  typewriterInto('twTapOut', "This is the real one. Say it and it's over - hot food, a bed, your people. And no prize.", 18);
}
export function forcePhoneMoment(){
  if (S.over) return;
  S.phoneForcedDay = S.day;
  showModal(`
    <h3>The phone is already in your hand</h3>
    <div class="wsub">You don't remember picking it up. It's just there, warm, waiting.</div>
    <button class="mbtn ghost" onclick="hideModal()">Put it down. Not today.</button>
    <button class="mbtn" onclick="confirmTapOutStep2()">Make the call</button>
  `);
}

export const CAUSES: any = {
  win: ['LAST ONE STANDING', 'The chopper comes in low over the treeline - for you, and only you. All nine rivals are gone. The $500,000 is yours.'],
  dead:['EVACUATED', 'Your vitals crashed in the night and the extraction team pulled you from the field. The wilderness wins this one.'],
  med: ['PULLED BY MEDICAL', 'The med team takes one look at you and shakes their heads. The mind was willing - the body was done.'],
  tap: ['TAPPED OUT', '"I\'m done. Come get me." No shame in it - most people don\'t last a week out here.'],
};
export function endGame(kind?){
  S.over = true; S.cause = kind;
  hideModal();
  startEndingSequence(kind);
}
export function showFinalStatsScreen(kind?){
  const [title, msg] = CAUSES[kind];
  $('endTitle').textContent = title;
  $('endTitle').className = kind === 'win' ? 'gold' : '';
  $('endDay').textContent = S.day;
  $('endCause').textContent = msg;
  const t = S.tot;
  const comfort = (S.chair?1:0)+(S.table?1:0)+(S.bed?1:0);
  const campWorks = [
    S.firepitTier>=2?'clay-lined pit':S.firepitTier>=1?'stone pit':'',
    S.rackTier>=2?'covered rack':S.rackTier>=1?'smoking rack':'',
    S.hugeRack?'huge rack':'',
    S.cacheTier>=3?'elevated cache':S.cacheTier>=2?'reinforced cache':S.cacheTier>=1?'cache':'',
    S.jug?'clay jug':'',
    S.berryPicker?'berry picker':'',
    S.dugout?'earth dugout':'',
  ].filter(Boolean).join(' · ') || 'none';
  const camp = `${S.dugout?'Earth dugout':SHELTERS[S.structure]}${S.insulation ? ' · moss ×' + S.insulation : ''}`;
  const topActs = Object.entries(S.acts).sort((a,b)=>b[1]-a[1]).slice(0,5)
    .map(([k,v]) => `${ACT_EMOJI[k]||''} ${k} ×${v}`).join('  ·  ') || '-';
  $('endStats').innerHTML = `
    <div class="endSect"><h4>The run</h4>
      <div class="row"><span>Rivals outlasted</span><span>${9 - S.rivals} / 9</span></div>
      <div class="row"><span>Storms endured</span><span>${t.storms}</span></div>
      <div class="row"><span>Peak max energy</span><span>${S.peakMax}</span></div>
      <div class="row"><span>Lowest health</span><span>${roundDisplay(S.minHealth)}</span></div>
      <div class="row"><span>BMI at end</span><span>${computeBMI().toFixed(1)}</span></div>
    </div>
    <div class="endSect"><h4>Food · ${t.food} gathered, ${t.meals} meals eaten</h4>
      <div class="row"><span>🫐 Foraged</span><span>${t.forage}</span></div>
      <div class="row"><span>🪤 Snared</span><span>${t.snared}</span></div>
      <div class="row"><span>🎣 Lines & net</span><span>${t.lines + t.net}</span></div>
      <div class="row"><span>🏹 Big &amp; medium game (animals)</span><span>${t.animalsKilled||0}</span></div>
      <div class="row"><span>🥓 Smoked & preserved</span><span>${t.smoked}</span></div>
      <div class="row"><span>Arrows remaining</span><span>${S.arrows}/9</span></div>
      <div class="row"><span>Line / wire remaining</span><span>${S.lineStock}/${TUNING.kit.lineStockTotal} · ${S.wireStock}/${TUNING.kit.wireStockTotal}</span></div>
    </div>
    <div class="endSect"><h4>Camp</h4>
      <div class="row"><span>Shelter</span><span>${camp}</span></div>
      <div class="row"><span>Camp works</span><span>${campWorks}</span></div>
      <div class="row"><span>Comforts built</span><span>${comfort ? [S.chair?'chair':'',S.table?'table':'',S.bed?'bed':''].filter(Boolean).join(', ') : 'none'}</span></div>
      <div class="row"><span>Fires lit / firewood hauled</span><span>${t.fires} / ${t.wood}</span></div>
      <div class="row"><span>Nights of music</span><span>${t.music}</span></div>
    </div>
    <div class="endSect"><h4>Hardship</h4>
      <div class="row"><span>Injuries</span><span>${t.injuries}</span></div>
      <div class="row"><span>Predator encounters</span><span>${t.predators}</span></div>
      <div class="row"><span>Critter raids</span><span>${t.raids||0}</span></div>
      <div class="row"><span>Bouts of sickness</span><span>${t.sick}</span></div>
      <div class="row"><span>Medical arcs survived</span><span>${S.arcsSurvived||0}</span></div>
    </div>
    <div class="endSect"><h4>Where the days went</h4>
      <div class="row" style="border:none"><span style="color:#d4cebd">${topActs}</span></div>
    </div>`;
  $('endEpilogue').innerHTML = `<div class="elabel">Six months later</div>` + buildEpilogue(kind).map(p=>`<p>${p}</p>`).join('');
  revealParagraphs('endEpilogue', 320);
  $('endStats').classList.add('hidden');
  $('statsToggleBtn').textContent = 'Show full stats';
  $('endScreen').classList.remove('hidden');
  render();
}
// v12 §7.4: pull one line of specificity from the run's actual card history for the epilogue.
export function cardHistoryEpilogueLine(){
  if (!S.cardHistory || !S.cardHistory.length) return null;
  const withVow = S.vow || (S.cardHistory.find(c=>c.id==='vow'));
  const c = pick(S.cardHistory);
  return `Somewhere in the middle of it all: ${c.text}`;
}
export function buildEpilogue(kind?){
  const p = [];
  const dayWord = S.day===1?'day':'days';
  const openers = {
    win: `Six months later, ask about those ${S.day} ${dayWord} on that lake and the answer changes depending on who's asking. The short version: you won. The long version takes longer.`,
    dead: `Six months later, the official record still says "evacuated for medical reasons" on day ${S.day}. It doesn't say how close that actually ran.`,
    med: `Six months later, the paperwork from the medical pull is still in a drawer somewhere. Day ${S.day}, it says. You could give them the date without looking.`,
    tap: S.forcedTapout
      ? `Six months later, you still don't fully remember deciding. The phone was just in your hand on day ${S.day}, and some part of you had already made the call before you caught up to it.`
      : `Six months later, you still remember the exact weight of the sat phone in your hand, and the sound of your own voice saying you were done, on day ${S.day}.`,
  };
  p.push(openers[kind] || openers.tap);
  p.push(`People still ask you what to call the person who did those ${S.day} ${dayWord}. You tell them it was just you, ${S.name}, the whole time - nobody more heroic was hiding in there.`);

  if (S.firstKill){
    p.push(`The first thing that still surfaces, unbidden, is ${GAME[S.firstKill.species].label} on day ${S.firstKill.day} - the first real kill, the one that made the whole thing feel less like a game and more like a life you had to actually keep.`);
  } else {
    p.push(`You never did land the first real kill you'd pictured before you went in. The traps and the lines carried you instead, quieter, less dramatic, just as much work.`);
  }

  if (S.tot.raids > 0){
    p.push(`${S.martenNamed} got the better of you more times than you'd like counted, by the end - bold, particular, unkillable by design and by choice. You still think about it more than you'd admit to a camera.`);
  } else {
    p.push(`Whatever was out there in the dark mostly left your stores alone, which in hindsight might have been its own kind of unsettling.`);
  }

  if (S.lostAnimal){
    const g = GAME[S.lostAnimal.species];
    p.push(`There's still ${g.label} out there somewhere with ${S.lostAnimal.detail}, as far as you know - the one that got away, the one you think about at the low moments even now.${S.lostAnimalResighted ? ' You saw it again, once, near the end. It didn\'t come any closer than it had to.' : ''}`);
  }

  if (S.lowestMoment){
    const lossKg = Math.max(0, +(S.startWeight - S.weight).toFixed(1));
    p.push(`You came through ${S.tot.storms} real storm${S.tot.storms===1?'':'s'} out there, and the worst of it - day ${S.lowestMoment.day}, ${S.lowestMoment.cause} - is still the night you'd least like to repeat. Somewhere in all of it you lost ${lossKg}kg you never fully got back.`);
  }

  const chLine = cardHistoryEpilogueLine();
  if (chLine) p.push(chLine);

  if (S.confessionals.length){
    const q = pick(S.confessionals);
    p.push(`On day ${q.day}, talking to a camera nobody else would really ever watch, you said: <span class="equote">"${q.text}"</span> You still mean it, some days more than others.`);
  }

  if (S.promisesFired && S.promisesFired.length){
    const pr = pick(S.promisesFired);
    p.push(pr.kept
      ? `You made yourself a promise out there - "${pr.text}" - and somehow, against the odds, you kept it.`
      : `You made yourself a promise out there - "${pr.text}" - and broke it, like most promises made in the dark eventually get broken.`);
  }
  const renamedSpots = [...S.woodsSpots, ...S.shoreSpots].filter(sp=>sp.renamed);
  if (renamedSpots.length){
    const sp = pick(renamedSpots);
    p.push(`Somewhere out there is a place you started calling ${sp.name} - nobody else will ever know why, or that it even has that name at all.`);
  }

  if (S.letters.length){
    for (const letter of S.letters){
      p.push(`Day ${letter.day}, a letter you never sent, never will: <span class="equote">"${letter.text}"</span>`);
    }
  }

  if (S.jay.stage >= 4){
    p.push(`There was a gray jay, too, by the end - Betty, you'd started calling her - landed right on your hand like it had decided something about you. It cost you real food you didn't have to spare, and it never gave you a single calorie back. You'd still call the trade fair.`);
  } else if (S.jay.gone){
    p.push(`There was a gray jay for a while. It stopped coming when the stores ran dry, the way anything smart would. You still think about the quiet after it left.`);
  } else if (S.jay.appeared){
    p.push(`A gray jay hung around the edges of camp for a stretch - never quite trusting you, never quite leaving either. Fair enough. Neither did you, most days.`);
  }
  if (S.crowNamed){
    p.push(`Roger was still around at the end, or a crow you'd decided was Roger - same snag most mornings, same unbothered look. You'll swear it was the same bird the rest of your life.`);
  }

  const dominant = dominantTagAxis();
  if (dominant) p.push(dominant);

  if (S.endingChoices && S.endingChoices.why){
    p.push(`Someone asked you why, once, after. "${S.endingChoices.why}" is what you told them, and it's still the truest answer you've got.`);
  }
  if (S.endingChoices && S.endingChoices.lastLook){
    p.push(`The last thing you looked at before they came for you was ${S.endingChoices.lastLook}. You couldn't say why that, exactly. Some part of you just needed it to be that.`);
  }

  if (kind === 'win'){
    p.push(`All nine of the others tapped out, were pulled, or didn't make it to the end. You did. That's the whole prize, really - that one sentence, and everything it cost to earn it.`);
  } else {
    p.push(`${S.rivals} of the others were still out there when your run ended. However it ends for you, most of them didn't make it either. It's not much comfort. It's something.`);
  }

  const closers = {
    partner: `The first thing you did back was find them and just stand there a minute before saying anything out loud. Some things don't need the sat-phone voice.`,
    kid: `You went straight for them when you got back - knelt down, said their name, and let the whole ${S.day} days go quiet behind you for a second.`,
    parent: `You called before you'd even properly showered. Whatever the phone was worth out there, it was worth more that day.`,
    nobody: `There wasn't really anyone waiting, and you'd told yourself that would make the ending easier. It didn't, particularly. It also didn't need to.`,
  };
  p.push(closers[S.backstory.who] || closers.nobody);

  return p;
}

