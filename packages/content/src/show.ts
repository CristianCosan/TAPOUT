import type { RunCast } from '@tapout/core';
import { P1 } from './protagonist.ts';
// The competition framing. Fictional show; rival names echo the v12 cast
// without copying real contestants. All open to Sir's veto (docs/DECISIONS.md).

export const SHOW = {
  name: 'HOLDOUT',
  prize: 400_000,
  prizeLabel: '$400,000',
} as const;

/** v12 name -> v1 rival. Order matches v12's RIVAL_NAMES so parity mapping stays trivial. */
export const RIVALS = [
  { v12: 'Dub', name: 'Doug', surname: 'Harlan' },
  { v12: 'Timber', name: 'Birch', surname: 'Calloway' },
  { v12: 'William', name: 'Willem', surname: 'Strand' },
  { v12: 'Roland', name: 'Ronald', surname: 'Pike' },
  { v12: 'Jordan', name: 'Jordie', surname: 'Lavelle' },
  { v12: 'Callie', name: 'Cassie', surname: 'Moreau' },
  { v12: 'Clay', name: 'Cole', surname: 'Brenner' },
  { v12: 'Lucas', name: 'Luke', surname: 'Ostrander' },
  { v12: 'Britt', name: 'Bree', surname: 'Halvorsen' },
] as const;

/** What a TAP / OUT run needs to know about its people (core `RunCast`). */
export const CAST: RunCast = {
  partner: P1.relationships.find((r) => r.role === 'partner')!.name,
  prizeLabel: SHOW.prizeLabel,
  rivals: Object.fromEntries(RIVALS.map((r) => [r.v12, `${r.name} ${r.surname}`])),
};
