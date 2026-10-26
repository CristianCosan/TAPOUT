// Not v12: the test mode Sir asked for in rc.3 (D-086), switched on in Settings. It changes the
// run only when you press one of these, and infinite energy only while it is on. Never touched by
// the parity bots.

import { nowAbs } from './helpers.ts';
import { log } from './setup.ts';
import { S } from './state.ts';
import { TEST_MODE } from './tuning.ts';
import { render } from './ui.ts';

/** Infinite energy: every action is paid for, then the bar is topped back up. */
export function testSetInfinite(on?){
  S.testInfinite = !!on;
  if (S.testInfinite) S.energy = S.maxEnergy;
  render();
}
export function testTopUp(){
  if (S.testInfinite && !S.over) S.energy = S.maxEnergy;
}
export function testMaterials(){
  const n = TEST_MODE.materials;
  S.stock.wood += n; S.stock.rocks += n; S.stock.moss += n; S.stock.clay += n; S.stock.firewood += n; S.tinder += n;
  log(`Test mode: +${n} logs, rocks, moss, clay, firewood and tinder.`, 'event');
  render();
}
export function testRestore(){
  S.hunger = 100; S.thirst = 100; S.warmth = 100; S.health = Math.max(S.health, 100); S.morale = Math.max(S.morale, 80); S.energy = S.maxEnergy; S.wet = 0;
  log('Test mode: fed, watered, warm, dry and rested.', 'event');
  render();
}
/** Every snare, line and the net has soaked long enough to be checked. */
export function testTrapsReady(){
  const back = nowAbs() - TEST_MODE.soakedHours;
  for (const t of [...(S.snareList||[]), ...(S.lineList||[])]) t.setAbs = back;
  if (S.net) S.net.setAbs = back;
  log('Test mode: every trap has soaked long enough to check.', 'event');
  render();
}
/** The last rival goes tonight, and the next morning's med check is the win. */
export function testWinNext(){
  S.tapDays = []; S.rivals = 0; S.wonPending = true; S.nextMedDay = S.day + 1;
  log('Test mode: the field is empty. Sleep, and the next morning brings the win.', 'event');
  render();
}
