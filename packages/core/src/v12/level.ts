// Harder levels (D-136, Sir 2026-11-19): after a win the player may pick a colder season and a
// winter kind for the next run. A normal run has no S.level, and every hook below is then a no-op,
// so v12 parity holds. The numbers come from the page and live in S.level itself.
import { S } from './state.ts';

/** Degrees added to the air temperature. */
export function levelTempC(){
  const L = S.level; if (!L) return 0;
  let t = L.temp || 0;
  if (L.mild) t += S.day <= 7 ? 4 : (S.day >= 12 ? -3 : 0);
  return t;
}
/** A catch chance with the level's change for 'fish' (lines, net) or 'snare'. */
export function levelCatch(q, kind){
  const L = S.level; if (!L || !L[kind]) return q;
  return Math.max(0, Math.min(0.9, q + L[kind]));
}
/** Morale lost at each dawn. */
export function levelDawn(){
  const L = S.level; if (!L || !L.nightMorale) return;
  S.morale = Math.max(0, Math.min(100, S.morale - L.nightMorale));
}
