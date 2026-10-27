// rc.5 (clothing, Sir): what you are wearing. Not in v12, which leaves you in the clothes on your
// back; under the rule you start in the thick jacket with the rain shell rolled in the pack.

import { log } from './setup.ts';
import { RULES } from './rules.ts';
import { S } from './state.ts';
import { afterAction, spend } from './threads.ts';
import { CLOTHES } from './tuning.ts';

export type Garment = 'jacket' | 'shell';

/** Whether a garment is on. Saves from before rc.5 have no record: the jacket is on. */
export function wearing(item: Garment): boolean {
  const c = S.clothes;
  return c ? !!c[item] : item === 'jacket';
}

/** Puts a garment on or takes it off: a minute, no energy. */
export function wear(item: Garment, on?: boolean){
  if (!RULES.clothing || S.over) return;
  const next = on === undefined ? !wearing(item) : !!on;
  if (next === wearing(item)) return;
  if (!spend(0, CLOTHES.changeHours, false, '')) return;
  S.clothes = { jacket: wearing('jacket'), shell: wearing('shell'), [item]: next };
  log(item === 'jacket'
    ? (next ? 'You shrug the thick jacket back on. Warmer straight away.' : 'You take the jacket off and tie it round your waist. Cooler to work in.')
    : (next ? 'You pull the rain shell over everything and zip it to the chin.' : 'You peel the shell off and roll it into the pack.'), 'info');
  afterAction('wear');
}

/** How the clothes change an hour of time passing. Neutral when the rule is off. */
export function clothesEffect(tags = ''){
  if (!RULES.clothing) return { warmMul: 1, rainMul: 1, exposureMul: 1, sweat: 0 };
  const jacket = wearing('jacket'), shell = wearing('shell');
  const heavy = tags.includes('w') || tags.includes('wood');
  return {
    warmMul: jacket ? CLOTHES.jacketWarmMul : 1,
    rainMul: shell ? CLOTHES.shellRainMul : 1,
    exposureMul: shell ? CLOTHES.shellExposureMul : 1,
    sweat: heavy ? (jacket ? CLOTHES.sweatPerHour.jacket : 0) + (shell ? CLOTHES.sweatPerHour.shell : 0) : 0,
  };
}
