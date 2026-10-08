// The one source of randomness for the whole simulation. v12 called Math.random(); the port
// calls rand(), which draws from a seeded, serialisable stream. Point it at a run's RngState
// with useRng() before calling anything else.

import { createRngState, nextFloat, type RngState } from '../rng/rng.ts';

let current: RngState = createRngState(1);

export function useRng(state: RngState): void {
  current = state;
}

export function currentRng(): RngState {
  return current;
}

export function rand(): number {
  return nextFloat(current);
}
