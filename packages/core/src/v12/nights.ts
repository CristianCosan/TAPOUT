// Sir 2026-11-20 (sirNights). Not in v12: with the flag off every function here is a no-op.
// When it starts to get dark a card says that being up at night costs more energy; it costs more each hour;
// at midnight you drag yourself back to the shelter and sleep, and wake more tired; every morning starts at dawn.
import { duskHour } from './helpers.ts';
import { RULES } from './rules.ts';
import { S } from './state.ts';
import { TUNING } from './tuning.ts';
import { showModal } from './ui.ts';

/** The hour it starts to get dark today. */
export function darkHour(){ return duskHour() - TUNING.sirNights.darkBeforeDusk; }

/** How much more energy a job costs at this hour. */
export function nightEnergyMul(){
  if (!RULES.sirNights || !S || S.hour < darkHour()) return 1;
  const N = TUNING.sirNights;
  return Math.min(N.energyMulMax, N.energyMulAtDark + N.energyMulPerHour * Math.floor(S.hour - darkHour()));
}

/** Called when nothing is on screen: the dusk card once a day, or the hard stop. True if it showed a card. */
export function nightCheck(){
  if (!RULES.sirNights || !S || S.over) return false;
  if (S.hour >= TUNING.sirNights.hardStopHour){
    showModal(`<h3>Lights out</h3><div class="wsub" id="draggedText">With the last bits of energy you drag your tired body back to the shelter and fall asleep.</div><button class="mbtn" onclick="hideModal(); forcedSleep()">Sleep</button>`);
    return true;
  }
  if (S.hour >= darkHour() && S.darkNoticeDay !== S.day){
    S.darkNoticeDay = S.day;
    showModal(`<h3>It's getting dark</h3><div class="wsub">From now on, being up costs more energy, and more the later it gets. At midnight your body decides for you.</div><button class="mbtn" onclick="hideModal()">Okay</button>`);
    return true;
  }
  return false;
}

/** Dawn, after the night's other work. */
export function nightMorning(notes){
  if (!RULES.sirNights) return false;
  if (S.dragged){
    S.dragged = false;
    const lost = Math.round(S.maxEnergy * TUNING.sirNights.draggedEnergyFrac);
    S.energy = Math.max(0, S.energy - lost);
    notes.push(`🥱 You fell asleep in your clothes, too late. You wake heavy. −${lost} energy`);
  }
  return true;
}
